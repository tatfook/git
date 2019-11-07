'use strict';

const _path = require('path');
const _util = require('util');
const child_process = require('child_process');
const mime = require('mime');
const fs = require('fs-extra');
const base64 = require("js-base64").Base64;

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

    async sync() {
        const params = this.validate();
        console.log(params);
        if (!params.project || !params.project.http_url) return this.success();
        const http_url = params.project.http_url;
        const paths = http_url.split("/");
        let reponame = paths[paths.length-1];
        let username = paths[paths.length-2];
    
        reponame = reponame.replace(/\.git$/, '');
        username = username.replace("gitlab_www_", "").replace("gitlab_rls_", "");
        console.log(username, reponame);

        const repopath = base64.encode(`${username}/${reponame}`);
        const fullpath = this.app.gitStore.getRepoFullPath(repopath);
        const exists = await fs.exists(fullpath);
        if (!exists) await this.app.gitStore.openRepository({path: repopath});

        console.log(fullpath);

        const exec = _util.promisify(child_process.exec);
        const config = await this.app.gitStore.nodegit.Config.openOndisk(`${fullpath}/config`);
        let isSetOrigin = true, result = null;
        try {
            const url = await config.getPath("remote.gitlab.url");
            if (url === http_url) isSetOrigin = false;
        } catch(e) {
            console.log(e);
        }
        if (isSetOrigin) {
            result = await exec(`git remote remove gitlab; git remote add gitlab ${http_url}; git pull gitlab master`, {cwd: fullpath});
            //console.log(result);
        } else {
            result = await exec(`git remote remove gitlab master`, {cwd: fullpath});
        }

        console.log(result);

        return this.success();
    }
}

module.exports = Repo;
