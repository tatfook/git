
const child_process = require("child_process");
const _path = require("path");
const _fs = require("fs");
const _ = require("lodash");
const Service = require('egg').Service;
const axios = require("axios");
const base64 = require('js-base64').Base64;

class GitService extends Service {
	get isCluster() {
		const cluster = this.app.config.GitServer.cluster;
		return cluster && cluster.enable ? true : false;
	}

	get gitStore() {
		return this.isCluster ? this.service.cluster : this.app.gitStore;
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

	async upload(data) {
		return await this.gitStore.upload(data);
	}

	async commit(data) {
		return await this.gitStore.commit(data);
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
