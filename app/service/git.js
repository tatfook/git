'use strict';

const Service = require('egg').Service;

class GitService extends Service {
    get gitStore() {
        return this.app.gitStore;
    }

    async saveFile(data) {
        return this.gitStore.saveFile(data);
    }

    async saveBinaryFile(streamData, payload) {
        return this.gitStore.saveBinaryFile(streamData, payload);
    }

    async deleteFile(data) {
        return this.gitStore.deleteFile(data);
    }

    async getBlob(data) {
        return this.gitStore.getBlob(data);
    }

    async getFileInfo(data) {
        return this.gitStore.getFileInfo(data);
    }

    async getFileRaw(data) {
        return this.gitStore.getFileRaw(data);
    }

    async upload(data) {
        return this.gitStore.upload(data);
    }

    async commit(data) {
        return this.gitStore.commit(data);
    }

    async history(data) {
        return this.gitStore.history(data);
    }

    async getTree(data) {
        return this.gitStore.getTree(data);
    }

    async getTreeById(data) {
        return this.gitStore.getTreeById(data);
    }

    async createArchive(data) {
        return this.gitStore.createArchive(data);
    }

    async getCommitInfo(data) {
        return this.gitStore.getCommitInfo(data);
    }

    getRepoFullPath(data) {
        return this.gitStore.getRepoFullPath(data);
    }
}

module.exports = GitService;
