'use strict';

const Service = require('egg').Service;

class GitService extends Service {
    get gitStore() {
        return this.app.gitStore;
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
