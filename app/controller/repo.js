'use strict';

const _util = require('util');
const child_process = require('child_process');
const fs = require('fs-extra');

const Controller = require('../core/controller.js');

class Repo extends Controller {
    get git() {
        return this.ctx.service.git;
    }

    async create() {
        const { repopath } = this.validate({ repopath: 'string' });

        await this.git.openRepository({ path: repopath });

        return this.success();
    }

    async rename() {
        const params = this.validate({
            oldRepoPath: 'string',
            newRepoPath: 'string',
        });

        await this.git.rename(params);

        return this.success(true);
    }

    async destroy() {
        const { repopath } = this.validate({ repopath: 'string' });
        const fullpath = this.git.getRepoFullPath(repopath);

        await fs.remove(fullpath);

        this.success(true);
    }

    async sync() {
        const params = this.validate();
        if (!params.project || !params.project.http_url) return this.success();

        const http_url = params.project.http_url;
        const paths = http_url.split('/');
        const old_reponame = paths[paths.length - 1];
        const old_username = paths[paths.length - 2]; // eslint-disable-line

        const reponame = old_reponame.replace(/\.git$/, '');
        const username = old_username
            .replace('gitlab_www_', '')
            .replace('gitlab_rls_', '');

        const gitlabConfig = this.config.GitServer.gitlab;
        const repoFullPath = this.app.gitStore.getRepoFullPath(
            `${username}/${reponame}`
        );
        const exec = _util.promisify(child_process.exec);
        const fullPath = `${gitlabConfig.repopath}/${old_username}/${old_reponame}/ ${repoFullPath}`;
        const result = await exec(
            `sshpass -p ${gitlabConfig.password} rsync -r -e "ssh -o StrictHostKeyChecking=no" ${fullPath}`,
            {}
        );
        this.ctx.logger.debug(result);

        return this.success();
    }
}

module.exports = Repo;
