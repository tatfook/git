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
        if (!params.project || !params.project.http_url) return this.success();

        const http_url = params.project.http_url;
        const paths = http_url.split("/");
        let old_reponame = paths[paths.length-1];
        let old_username = paths[paths.length-2];
    
        const reponame = old_reponame.replace(/\.git$/, '');
        const username = old_username.replace("gitlab_www_", "").replace("gitlab_rls_", "");
        //console.log(username, reponame);

        const gitlabConfig = this.config.GitServer.gitlab;
        const fullpath = this.app.gitStore.getRepoFullPath(`${username}/${reponame}`);
        const exec = _util.promisify(child_process.exec);
        const result = await exec(`sshpass -p ${gitlabConfig.password} rsync -r -e "ssh -o StrictHostKeyChecking=no" ${gitlabConfig.repopath}/${old_username}/${old_reponame}/ ${fullpath}`, {});
        this.ctx.logger.debug(result);

        return this.success();
    }
}

module.exports = Repo;
