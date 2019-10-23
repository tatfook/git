const assert = require("assert");
const child_process = require("child_process");
const _path = require("path");
const _fs = require("fs");
const _ = require("lodash");
const base64 = require('js-base64').Base64;
const axios = require("axios");
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
				Authorization: "Bearer keepwork",
			}
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
		const slaves = this.config.GitServer.slaves || [];
		return slaves.map(o => {
			return {
				hostname: o.hostname,
				baseUrl: o.baseUrl,
				requestCount: 0,
			}
		});
	}

	// 获取 slave
	async getSlave(repopath) {
		const repostr = base64.encode(repopath);
		// 上分布式锁 过期时间为 30 min
		const lockResults = await this.redis.multi().
			set(this.getRedisKey(`repo_lock_${repostr}`), this.hostname, "EX", 60 * 30, "NX").
			get(this.getRedisKey(`repo_info_${repostr}`)).
			get(this.getRedisKey(`slaves`)).
			exec().catch(e => {
				console.log(e);
				throw new Error("redis transaction failed: getSlave");
			}); 

		const unlock = async () => this.redis.del(`repo_lock_${repostr}`);
		const repoinfo = this.helper.fromJson(lockResults[1][1]) || {blacklist:[]};
		const slaves = this.helper.fromJson(lockResults[2][1]) || this.getDefaultSlavesInfo();

		// slave 黑名单
		repoinfo.blacklist = repoinfo.blacklist || [];

		let slave = null;
		//console.log(repoinfo);
		//console.log(slaves);
		if (repoinfo.fixedHostname) {  // 固定在某台主机
			slave = _.find(slaves, o => o.hostname === repoinfo.fixedHostname);
		} else if (repoinfo.hostname) { // 最后一次操作主机
			slave = _.find(slaves, o => o.hostname === repoinfo.hostname);
			// 若此主机请求太多, 可在其它随机
		} else {  // 随机主机
			//console.log(slaves.filter(o => repoinfo.blacklist.findIndex(hostname => hostname == o.hostname) !== 0))
			slave = _.minBy(slaves.filter(o => repoinfo.blacklist.findIndex(hostname => hostname == o.hostname) !== 0), o => o.requestCount);
		}

		if (!slave) {
			await unlock();
			throw new Error("服务器错误, 仓库所在主机不存在");
		}

		slave.requestCount++
		repoinfo.hostname = slave.hostname;
		repoinfo.fixedHostname = slave.hostname;

		//console.log(slave);

		// 解除分布式锁 
		await this.redis.multi().
			del(this.getRedisKey(`repo_lock_${repostr}`)).
			set(this.getRedisKey(`repo_info_${repostr}`), this.helper.toJson(repoinfo)).
			set(this.getRedisKey(`slaves`), this.helper.toJson(slaves)).
			exec().catch(e => {
				console.log(e);
				throw new Error("redis transaction unlock failed");
			});
		
		return slave;
	}

	// 释放 slave
	async freeSlave({repopath, hostname}) {
		const repostr = base64.encode(repopath);
		const lockResults = await this.redis.multi().
			set(this.getRedisKey(`repo_lock_${repostr}`), this.hostname, "EX", 60 * 30, "NX").
			get(this.getRedisKey(`repo_info_${repostr}`)).
			get(this.getRedisKey(`slaves`)).
			exec().catch(e => {
				console.log(e);
				throw new Error("redis transaction failed: getSlave");
			}); 

		const repoinfo = this.helper.fromJson(lockResults[1][1]) || {};
		const slaves = this.helper.fromJson(lockResults[2][1]) || [];
		const slave = _.find(slaves, o => o.hostname === hostname);

		//repoinfo.hostname = repoinfo.fixedHostname = undefined;
		if (repoinfo.hostname === hostname) repoinfo.hostname = undefined; // 理论上一定相同
		if (repoinfo.fixedHostname == hostname) repoinfo.fixedHostname = undefined;
		if (slave) slave.requestCount--;;

		// 解除分布式锁 
		await this.redis.multi().
			del(this.getRedisKey(`repo_lock_${repostr}`)).
			set(this.getRedisKey(`repo_info_${repostr}`), this.helper.toJson(repoinfo)).
			set(this.getRedisKey(`slaves`), this.helper.toJson(slaves)).
			exec().catch(e => {
				console.log(e);
				throw new Error("redis transaction unlock failed");
			});

		return ;
	}

	async clone({repopath, ref="refs/heads/master"}) {
		const repostr = base64.encode(repopath);
		const origin = this.config.GitServer.cluster.remoteGitUrl;
		const url = `${origin}/${repostr}`;
		const fullpath = this.gitStore.getRepoFullPath(repopath);

		// 仓库已存在
		if (_fs.existsSync(fullpath)) return true;

		// 不存在clone
		return await new Promise((resolve, reject) => {
			const cmdstr = `git clone --depth=1 --bare --no-single-branch ${url} ${fullpath}`;
			console.log("exec:", cmdstr);
			child_process.exec(cmdstr, {
			}, (error, stdout, stderr) => {
				console.log({error, stdout, stderr});
				if (error) {
					return resolve(false);
				}
				return resolve(true);
			});
		});
	}

	// 拉取远程仓库
	async pull({repopath, ref = "refs/heads/master"}) {
		const fullpath = this.gitStore.getRepoFullPath(repopath);

		// 仓库不存在 直接返回true 
		if (!_fs.existsSync(fullpath)) return true;

		ref = this.gitStore.formatRef({ref});

		// 不存在clone
		return await new Promise((resolve, reject) => {
			const cmdstr = `git pull origin ${ref}`;
			console.log("exec:", cmdstr);
			child_process.exec(cmdstr, {
				cwd: fullpath,
			}, (error, stdout, stderr) => {
				console.log({error, stdout, stderr});
				if (error) {
					return resolve(false);
				}
				return resolve(true);
			});
		});
	}

	// 推送远程仓库
	async push({repopath, ref="refs/heads/master"}) {
		const fullpath = this.gitStore.getRepoFullPath(repopath);
		const hostname = this.hostname;
		let tryCount = 0;

		ref = this.gitStore.formatRef({ref});

		const ok = await new Promise((resolve, reject) => {
			const _push = () => {
				const cmdstr = `git push origin ${ref}`;
				console.log("exec:", cmdstr);
				child_process.exec(cmdstr, {
					cwd: fullpath,
				}, (error, stdout, stderr) => {
					console.log({error, stdout, stderr});
					if (error) {
						tryCount++;

						// 失败次数超过3次 放弃推送
						if (tryCount > 3) {
							// 报警系统
							return resolve(false);
						}

						setTimeout(_push, 1000); // 可以等待长点时间 重试

						return;
					}

					return resolve(true);
				});
			}
			_push();
		});

		// 推送失败直接返回
		if (!ok) return;

		// 通知其他客户端拉取提交

		// 释放资源
		await this.freeSlave({repopath, hostname});
	}

	async saveFile(data) {
		const {repopath} = data;

		// slave host save file
		if (this.isSlave) {
			// clone repo 
			const ok = await this.clone({repopath});
			if (!ok) throw new Error("pull git repository failed");
			
			// save file
			const result = await this.gitStore.saveFile(data);

			// async push repo
			await this.push({repopath}); // push 到远程库

			return result;
		}
		
		// 确保仓库的存在
		await this.gitStore.openRepository({path: repopath});

		// 获取从属主机
		const slave = await this.getSlave(repopath);
		
		// 测试环境直接写文件结束 正式环境发送至slave机
		const result = this.config.env === "unittest" ? await this.gitStore.saveFile(data) : await this.axios.post(`${slave.baseUrl}/file`, data);

		return result;
	}
}

module.exports = ClusterService;
