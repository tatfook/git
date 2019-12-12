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

    async commitInfo() {
        const { repopath, commitId, ref = 'master' } = this.validate({
            repopath: 'string',
            commitId: 'string_optional',
            ref: 'string_optional',
        });
        const commit = await this.git.getCommitInfo({
            repopath,
            commitId,
            ref,
        });
        this.success(commit);
    }

    /**
     * sync repo from gitlab, makesure sshpass work on the git server.
     * gitlabRepoUrl {string} gitlab repo url such as "http://git.kp.com/gitlab_www_hello/demo.git"
     * repopath {string} lcoal repo path such as "hello/demo"
     * forceSync {boolean} force replace even already exist
     */
    async sync() {
        const { gitlabRepoUrl, repopath, forceSync } = this.validate({
            repopath: 'string',
            gitlabRepoUrl: 'string',
            forceSync: 'boolean_optional',
        });

        const repoFullPath = this.app.gitStore.getRepoFullPath(repopath);
        if (fs.existsSync(repoFullPath)) {
            if (forceSync) {
                await fs.remove(repoFullPath);
            } else {
                return this.success();
            }
        }

        const paths = gitlabRepoUrl.split('/');
        const gitlab_reponame = paths[paths.length - 1];
        const gitlab_username = paths[paths.length - 2]; // eslint-disable-line

        const gitlabConfig = this.config.GitServer.gitlab;
        const exec = _util.promisify(child_process.exec);
        const fullPath = `${gitlabConfig.repopath}/${gitlab_username}/${gitlab_reponame}/ ${repoFullPath}`;
        await exec(
            `sshpass -p ${gitlabConfig.password} rsync -r -e "ssh -o StrictHostKeyChecking=no" ${fullPath}`,
            {}
        );
        this.ctx.logger.info('synced: ', repoFullPath);

        return this.success();
    }
}

module.exports = Repo;
