'use strict';

// const assert = require('assert');
const child_process = require('child_process');
const os = require('os');
// const _path = require('path');
const _fs = require('fs');
const _ = require('lodash');
const base64 = require('js-base64').Base64;
const axios = require('axios');
const Service = require('egg').Service;

// master服务只读
// slave服务只写
//
class ClusterService extends Service {
    get helper() {
        return this.ctx.helper;
    }

    get redis() {
        return this.app.redis;
    }

    get hostname() {
        return this.config.GitServer.cluster.hostname || os.hostname();
    }

    get axios() {
        return axios.create({
            headers: {
                Authorization: 'Bearer keepwork',
            },
        });
    }

    get gitStore() {
        return this.app.gitStore;
    }

    get isMaster() {
        return this.app.config.GitServer.cluster.master;
    }

    get isSlave() {
        return !this.isMaster;
    }

    getRedisKey(key) {
        const prefix = this.config.GitServer.redisPrefix;
        return `${prefix}_${key}`;
    }

    getDefaultSlavesInfo() {
        const slaves = this.config.GitServer.cluster.slaves || [];
        return slaves.map(o => {
            return {
                hostname: o.hostname,
                baseUrl: o.baseUrl,
                requestCount: 0,
            };
        });
    }

    // 获取 slave
    async getSlave(repopath) {
        // const repostr = base64.encode(repopath);
        const no = _.toNumber(repopath);
        const slavess = this.getDefaultSlavesInfo();
        const slavesLength = 2;
        return slavess[no % slavesLength];
        // // 上分布式锁 过期时间为 30 min
        // let tryLockCount = 0;
        // let lockResults = null;
        // while (!lockResults && tryLockCount < 3) {
        // lockResults = await this.redis.multi().
        // set(this.getRedisKey(`repo_lock_${repostr}`), this.hostname, 'EX', 60 * 30, 'NX').
        // get(this.getRedisKey(`repo_info_${repostr}`)).
        // hgetall(this.getRedisKey('slave_request_count')).
        // exec()
        // .catch(e => {
        // console.log(e);
        // // throw new Error("redis transaction failed: getSlave");
        // return;
        // });
        // tryLockCount++;
        // if (!lockResults) {
        // await this.ctx.helper.sleep(200);
        // }
        // }
        // if (!lockResults) {
        // throw new Error('仓库已被锁定, 请稍后重试');
        // }

        // this.ctx.logger.debug(`仓库上锁: repo_lock_${repostr}`);
        // const unlock = async () => this.redis.del(`repo_lock_${repostr}`);
        // const repoinfo = this.helper.fromJson(lockResults[1][1]) || await this.app.model.Repository.getByPath({ repopath }) || {};
        // const slaveRequestCount = this.helper.fromJson(lockResults[2][1]) || {};
        // const slaves = this.getDefaultSlavesInfo();
        // assert(slaves.length);

        // // console.log(lockResults);
        // // console.log(slaveRequestCount);

        // let slave = null;
        // // this.ctx.logger.debug(repoinfo);
        // // this.ctx.logger.debug(slaves);
        // if (repoinfo.fixedHostname) { // 固定在某台主机   主机未push
        // slave = _.find(slaves, o => o.hostname === repoinfo.fixedHostname);
        // this.ctx.logger.debug(`仓库未推送, 选择未推送主机: hostname = ${slave.hostname}, requestCount = ${slave.requestCount}`);
        // } else if (repoinfo.cacheHostname) { // 最后一次操作主机 主机push 仓库最新
        // slave = _.find(slaves, o => o.hostname === repoinfo.cacheHostname);
        // this.ctx.logger.debug(`仓库存在缓存, 选择缓存主机: hostname = ${slave.hostname}, requestCount = ${slave.requestCount}`);
        // } else { // 随机主机 无主机存在仓库
        // slave = _.minBy(slaves, o => slaveRequestCount[o.hostname] || 0);
        // this.ctx.logger.debug(`选择空闲主机: hostname = ${slave.hostname}, requestCount = ${slave.requestCount}`);
        // }

        // // this.ctx.logger.debug(slave);

        // if (!slave) {
        // await unlock();
        // await this.service.log.error('无法分配Slave主机', { repoinfo, slaves });
        // throw new Error('服务器错误, 仓库所在主机不存在');
        // }

        // const hostname = slave.hostname;
        // slave.requestCount++;
        // slave.pushed = !repoinfo.fixedHostname;
        // repoinfo.cacheHostname = hostname;
        // repoinfo.fixedHostname = hostname;

        // // console.log(slave);

        // // 解除分布式锁
        // await this.redis.multi().
        // del(this.getRedisKey(`repo_lock_${repostr}`)).
        // set(this.getRedisKey(`repo_info_${repostr}`), this.helper.toJson(repoinfo)).
        // hincrby(this.getRedisKey('slave_request_count'), slave.hostname, 1).
        // exec()
        // .catch(e => {
        // console.log(e);
        // this.ctx.logger.error(e);
        // this.service.log.error('仓库解锁失败', { repoinfo, slaves });
        // throw new Error('redis transaction unlock failed');
        // });

        // this.ctx.logger.debug(`仓库解锁: repo_lock_${repostr}`);
        // return slave;
    }

    // 释放 slave
    async freeSlave({ repopath, hostname }) {
        // 数据库解绑  清除unpush标记, 保留cache标记
        await this.app.model.Repository.upsert({ repopath, fixedHostname: null });

        // redis 释放
        const fullpath = this.gitStore.getRepoFullPath(repopath);
        const repostr = base64.encode(repopath);
        const locktime = 1800; // 60 * 30
        const lockResults = await this.redis.multi().
            set(this.getRedisKey(`repo_lock_${repostr}`), this.hostname, 'EX', locktime, 'NX').
            get(this.getRedisKey(`repo_info_${repostr}`)).
            hget(this.getRedisKey('slave_request_count'), hostname).
            exec()
            .catch(() => {
                // console.log(e);
                throw new Error('redis transaction failed: getSlave');
            });

        const repoinfo = this.helper.fromJson(lockResults[1][1]) || await this.app.model.Repository.getByPath({ repopath }) || {};
        const requestCount = _.toNumber(lockResults[2][1]) || 0;

        // repoinfo.hostname = repoinfo.fixedHostname = undefined;
        if (repoinfo.fixedHostname === hostname) repoinfo.fixedHostname = undefined;

        const defaultMaxRequestCount = 1000;
        const clusterMaxRequestCount = this.config.GitServer.cluster.maxRequestCount || defaultMaxRequestCount;
        if (requestCount > clusterMaxRequestCount) {
            this.ctx.helper.rm(fullpath); // 移除项目
            if (repoinfo.cacheHostname === hostname) {
                await this.app.model.Repository.upsert({ repopath, cacheHostname: null, fixedHostname: null });
                repoinfo.cacheHostname = undefined; // 理论上一定相同
            }
        }

        // 解除分布式锁
        await this.redis.multi().
            del(this.getRedisKey(`repo_lock_${repostr}`)).
            set(this.getRedisKey(`repo_info_${repostr}`), this.helper.toJson(repoinfo)).
            hincrby(this.getRedisKey('slave_request_count'), hostname, -1).
            exec()
            .catch(() => {
                // console.log(e);
                throw new Error('redis transaction unlock failed');
            });

        return;
    }

    async clone({ repopath }) {
        const repostr = base64.encode(repopath);
        const origin = this.config.GitServer.cluster.remoteGitUrl;
        const url = `${origin}/${repostr}`;
        const fullpath = this.gitStore.getRepoFullPath(repopath);

        // 仓库已存在
        if (_fs.existsSync(fullpath)) return true;

        // 不存在clone
        return await new Promise(resolve => {
            const cmdstr = `git clone --depth=1 --bare --no-single-branch ${url} ${fullpath}`;
            this.ctx.logger.info('cwd:', fullpath);
            this.ctx.logger.info('exec:', cmdstr);
            child_process.exec(cmdstr, {
            }, (error, stdout, stderr) => {
                this.ctx.logger.info({ error, stdout, stderr });
                if (error) {
                    this.ctx.logger.warn(`命令执行失败: ${cmdstr},  stdout:${stdout}, stderr: ${stderr}`);
                    return resolve(false);
                }
                return resolve(true);
            });
        });
    }

    // 拉取远程仓库
    async pull({ repopath, ref = 'refs/heads/master' }) {
        const fullpath = this.gitStore.getRepoFullPath(repopath);

        // 仓库不存在 直接返回true
        if (!_fs.existsSync(fullpath)) return true;

        ref = this.gitStore.formatRef({ ref });

        // 不存在clone
        return await new Promise(resolve => {
            const cmdstr = `git pull origin ${ref}`;
            this.ctx.logger.info('cwd:', fullpath);
            this.ctx.logger.info('exec:', cmdstr);
            child_process.exec(cmdstr, {
                cwd: fullpath,
            }, (error, stdout, stderr) => {
                // console.log({error, stdout, stderr});
                if (error) {
                    this.ctx.logger.warn(`命令执行失败: ${cmdstr},  stdout:${stdout}, stderr: ${stderr}`);
                    return resolve(false);
                }
                return resolve(true);
            });
        });
    }

    // 推送远程仓库
    async push({ repopath, ref = 'refs/heads/master' }) {
        const fullpath = this.gitStore.getRepoFullPath(repopath);
        const hostname = this.hostname;
        let tryCount = 0;

        ref = this.gitStore.formatRef({ ref });

        // await this.ctx.helper.sleep(_.random(1000, 3000));

        const ok = await new Promise(resolve => {
            const maxTryCount = 3;
            const _push = () => {
                const cmdstr = `git push origin ${ref}`;
                this.ctx.logger.info('cwd:', fullpath);
                this.ctx.logger.info('exec:', cmdstr);
                child_process.exec(cmdstr, {
                    cwd: fullpath,
                }, (error, stdout, stderr) => {
                    // console.log({error, stdout, stderr});
                    if (error) {
                        tryCount++;

                        this.ctx.logger.warn(`命令执行失败: ${cmdstr},  stdout:${stdout}, stderr: ${stderr}`);

                        // 失败次数超过3次 放弃推送
                        if (tryCount > maxTryCount) {
                            // 报警系统
                            return resolve(false);
                        }

                        setTimeout(_push, 0); // 可以等待长点时间 重试

                        return;
                    }

                    return resolve(true);
                });
            };
            _push();
        });

        // 推送失败直接返回
        if (!ok) {
            // TODO 错误日志
            this.service.log.error('仓库推送失败', { fullpath, hostname });
            return;
        }

        // 通知其他客户端拉取提交

        // 释放资源
        await this.freeSlave({ repopath, hostname });
    }

    async exec(action, data) {
        const hostname = this.hostname;
        const { repopath } = data;

        const isCommit = action === 'saveFile' || action === 'deleteFile' || action === 'commit';
        const isWrite = action === 'upload' || isCommit;
        // slave host save file
        if (this.isSlave) {
            this.ctx.logger.info(`slave:${action}`);
            // clone repo
            const ok = await this.clone({ repopath });
            if (!ok) {
                throw new Error('pull git repository failed');
            }

            if (isWrite) { // 写操作 锁定主机
                await this.app.model.Repository.upsert({ repopath, cacheHostname: hostname, fixedHostname: hostname });
            }

            // save file
            const result = await this.gitStore[action](data);

            // async push repo
            if (isCommit) {
                // await this.push({repopath}); // push 到远程库
                this.push({ repopath }); // push 到远程库
            }

            return result;
        }

        this.ctx.logger.debug(`exec: ${action}`);

        // 确保仓库的存在
        await this.gitStore.openRepository({ path: repopath });

        // 获取从属主机
        const slave = await this.getSlave(repopath);

        // 测试环境直接写文件结束 正式环境发送至slave机
        if (this.config.env === 'unittest' && isWrite) {
            return await this.gitStore[action](data);
        }

        const baseUrl = slave.baseUrl;
        if (action === 'saveFile') {
            return await this.axios.post(`${baseUrl}/file`, data).then(res => res.data);
        } else if (action === 'deleteFile') {
            return await this.axios.delete(`${baseUrl}/file`, data).then(res => res.data);
        } else if (action === 'upload') {
            return await this.axios.post(`${baseUrl}/file/upload`, data).then(res => res.data);
        } else if (action === 'commit') {
            return await this.axios.post(`${baseUrl}/file/commit`, data).then(res => res.data);
        }
        // 读取数据

        // 存未推送数据, 先进行推送
        if (!slave.pushed) {
            if (this.config.env === 'unittest') {
                // await this.push(data);
            } else {
                await this.axios.post(`${baseUrl}/cluster/push`, data);
            }
        }

        // 本地读取相关数据
        return await this.gitStore[action](data);
    }

    async saveFile(data) {
        return await this.exec('saveFile', data);
    }

    async deleteFile(data) {
        return await this.exec('deleteFile', data);
    }

    async getFile(data) {
        return await this.exec('getFile', data);
    }

    async upload(data) {
        return await this.exec('upload', data);
    }

    async commit(data) {
        return await this.exec('commit', data);
    }

    async history(data) {
        return await this.exec('history', data);
    }

    async getTreeById(data) {
        return await this.exec('getTreeById', data);
    }

    async getTree(data) {
        return await this.exec('getTree', data);
    }

    async createArchive(data) {
        return await this.exec('createArchive', data);
    }
}

module.exports = ClusterService;
