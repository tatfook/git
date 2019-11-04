'use strict';

const _path = require('path');
const mime = require('mime');
const fs = require('fs-extra');

const Controller = require('../core/controller.js');

class Repo extends Controller {
    get git() {
        return this.ctx.service.git;
    }

    async create() {
        const {repopath} = this.validate({repopath: "string"});

        await this.git.openRepository({path: repopath});

        return this.success();
    }

    async rename() {
        const params = this.validate({
            oldRepoPath: "string",
            newRepoPath: "string",
        });

        await this.git.rename(params);

        return this.success();
    }

    async destroy() {
        const {repopath} = this.validate({repopath: "string"});
        const fullpath = this.git.getRepoFullPath(repopath);

        await fs.remove(fullpath);

        this.success(true);
    }
}

module.exports = Repo;
