'use strict';

const _path = require('path');
const _fs = require('fs');
const mime = require('mime');

const Controller = require('../core/controller.js');

class File extends Controller {
    get git() {
        return this.ctx.service.git;
    }

    parseParams(rule = {}) {
        const params = this.validate({ ...rule, repopath: 'string' });
        params.ref = params.ref || 'master';
        return params;
    }

    async show() {
        const params = this.parseParams({
            repopath: 'string',
            filepath: 'string',
            commitId: 'string_optional',
        });

        const { blob } = await this.git
            .getBlob(params)
            .catch(e => this.ctx.logger.error(e));
        if (!blob) return this.fail('Not Found', 404);
        if (blob.isBinary()) {
            return this.fail('Please use raw api to get binary data', 400);
        }

        return this.success(blob.toString());
    }

    async info() {
        const params = this.parseParams({
            repopath: 'string',
            filepath: 'string',
            commitId: 'string_optional',
        });

        const file = await this.git
            .getFileInfo(params)
            .catch(e => this.ctx.logger.error(e));
        if (!file) return this.fail('Not Found', 404);

        return this.success(file);
    }

    async raw() {
        const params = this.parseParams({
            repopath: 'string',
            filepath: 'string',
            commitId: 'string_optional',
        });

        const filename = _path.basename(params.filepath);
        const raw = await this.git
            .getFileRaw(params)
            .catch(e => this.ctx.logger.error(e));
        if (!raw) return this.fail('Not Found', 404);
        this.ctx.set('Cache-Control', 'public, max-age=86400');
        const mimeType = mime.getType(filename);
        this.ctx.set('Content-Disposition', `attachment; filename=${filename}`);
        this.ctx.set('Content-Description', 'File Transfer');
        this.ctx.set('Content-Transfer-Encoding', 'binary');
        this.ctx.set('Content-Type', 'application/octet-stream');
        if (mimeType) {
            this.ctx.set('Content-Type', mimeType);
            if (mimeType.match('image') || mimeType.match('text')) {
                this.ctx.set(
                    'Content-Disposition',
                    `inline; filename=${filename}`
                );
            }
        }
        return this.success(raw);
    }

    async upload() {
        const params = this.parseParams({
            repopath: 'string',
            content: 'string',
            encoding: 'string_optional',
        });

        const data = await this.git.upload(params);

        return this.success(data);
    }

    async commit() {
        const params = this.parseParams({
            repopath: 'string',
            ref: 'string_optional',
            message: 'string_optional',
        });

        const data = await this.git.commit(params);
        if (!data) return this.throw(500, '提交失败');

        return this.success(data);
    }

    async save() {
        const params = this.parseParams({
            repopath: 'string',
            filepath: 'string',
            content: 'string_optional',
            message: 'string_optional',
            committer: 'object_optional',
            encoding: 'string_optional',
        });

        const data = await this.git.saveFile(params);

        return this.success(data);
    }

    async saveBinary() {
        const payload = this.parseParams({
            repopath: 'string',
            filepath: 'string',
            message: 'string_optional',
            committer: 'object_optional',
            encoding: 'string_optional',
        });
        const streamData = this.ctx.req;
        const data = await this.git.saveBinaryFile(streamData, payload);

        return this.success(data);
    }

    async destroy() {
        const params = this.parseParams({
            repopath: 'string',
            filepath: 'string',
            message: 'string_optional',
            committer: 'object_optional',
        });

        const data = await this.git.deleteFile(params);

        return this.success(data);
    }

    async history() {
        const params = this.parseParams({
            repopath: 'string',
            filepath: 'string',
            commitId: 'string_optional',
            maxCount: 'number_optional',
        });

        const list = await this.git.history(params);

        return this.success(list);
    }

    async getTreeByPath() {
        const params = this.parseParams({
            repopath: 'string',
            recursive: 'boolean_optional',
            commitId: 'string_optional',
            ref: 'string_optional',
        });

        const tree = await this.git.getTree(params);

        return this.success(tree);
    }

    async getArchive() {
        const params = this.parseParams({
            repopath: 'string',
            ref: 'string_optional',
        });

        const filepath = await this.git.createArchive(params);
        const filestream = _fs.createReadStream(filepath);

        this.ctx.set('Content-Description', 'File Transfer');
        this.ctx.set('Content-Type', 'application/octet-stream');
        this.ctx.set('Content-Transfer-Encoding', 'binary');
        this.ctx.set('Expires', '0');
        this.ctx.set('Cache-Control', 'must-revalidate');
        this.ctx.set('Pragma', 'public');
        this.ctx.body = filestream;
    }
}

module.exports = File;
