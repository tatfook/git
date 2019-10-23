
const child_process = require("child_process");
const _path = require("path");
const _fs = require("fs");
const _ = require("lodash");
const Service = require('egg').Service;
const Git = require("nodegit");
const axios = require("axios");
const base64 = require('js-base64').Base64;

class GitService extends Service {
	get isCluster() {
		const cluster = this.app.config.GitServer.cluster;
		return cluster && cluster.enable ? true : false;
	}

	get redis() {
		return this.app.redis;
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
		return this.app.config.GitServer.master;
	}

	get isSlave() {
		return !this.isMaster;
	}

	async proxySaveFile(slave, data) {
		const url = `${slave.baseUrl}/file`;

		return this.axios.post(url, data);
	}

	async proxyDeleteFile(slave, data) {
		const url = `${slave.baseUrl}/file`;

		return this.axios.delete(url, {params: data});
	}

	async pull({repopath}) {
		const repostr = base64.encode(repopath);
		const origin = this.config.GitServer.remoteGitUrl;
		const url = `${origin}/${repostr}`;
		const fullpath = this.gitStore.getRepoFullPath(repopath);

		// 仓库已存在
		if (_fs.existsSync(fullpath)) return true;

		// 不存在clone
		return await new Promise((resolve, reject) => {
			child_process.exec(`git clone --depth=1 --bare ${url} ${fullpath}`, {
			}, (error, stdout, stderr) => {
				console.log(error, stdout, stderr);
				if (error) {
					return resolve(false);
				}
				return resolve(true);
			});
		})
	}

	async push({repopath}) {
		const fullpath = this.gitStore.getRepoFullPath(repopath);
		const hostname = this.hostname;

		const ok = await new Promise((resolve, reject) => {
			child_process.exec("git push origin master", {
				cwd: fullpath,
			}, (error, stdout, stderr) => {
				console.log(error, stdout, stderr);
				if (error) {
					return resolve(false);
				}

				return resolve(true);
			});
		});

		if (ok) return;

		const cluster = this.service.cluster;
		await cluster.setFixedHostname(repopath, hostname);
	}

	async saveFile(data) {
		return await this.gitStore.saveFile(data);
	}

	async deleteFile(data) {
		return await this.gitStore.deleteFile(data);
	}

	async getFile(data) {
		return await this.gitStore.getFile(data);
	}

	async history(data) {
		return await this.gitStore.history(data);
	}

	async getTree(data) {
		return await this.gitStore.getTree(data);
	}

	async getTreeById(data) {
		return await this.gitStore.getTreeById(data);
	}

	async createArchive(data) {
		return await this.gitStore.createArchive(data);
	}
}

module.exports = GitService;
