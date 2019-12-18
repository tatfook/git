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

        const file = await this.git.getFile(params).catch(() => undefined);
        if (!file) return this.fail('Not Found', 404);
        delete (file, 'content'); // no need to put content data to repo info

        return this.success(file);
    }

    async raw() {
        const params = this.parseParams({
            repopath: 'string',
            filepath: 'string',
            commitId: 'string_optional',
        });

        const filename = _path.basename(params.filepath);
        const file = await this.git.getFile(params).catch(() => undefined);
        if (!file) return this.fail('Not Found', 404);
        this.ctx.set('Cache-Control', 'public, max-age=86400');
        const mimeType = mime.getType(filename);
        if (mimeType) {
            this.ctx.set('Content-Type', mimeType);
            if (mimeType.indexOf('text/') === 0) {
            } else if (mimeType.indexOf('image/') === 0) {
                this.ctx.set(
                    'Content-Disposition',
                    `inline; filename=${filename}`
                );
            } else {
                this.ctx.set(
                    'Content-Disposition',
                    `attachment; filename=${filename}`
                );
            }
        }

        return this.success(
            file.binary ? file.content : file.content.toString()
        );
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
        const filestream = _fs.createReadStream(filepath, { emitClose: true });

        filestream.on('close', () => {
            _fs.unlinkSync(filepath);
        });

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
