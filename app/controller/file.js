const _path = require("path");
const _fs = require("fs");
const mime = require("mime");
const Git = require("nodegit");

const Controller = require("../core/controller.js");

class File extends Controller {

	get gitStore() {
		return this.app.gitStore;
	}

	parseParams(rule = {}) {
		//const uid = "";
		const {uid} = this.authenticated();

		const params = this.validate({...rule, repopath: "string", filepath:"string"});

		params.repopath = _path.join(`${uid}`, params.repopath);
		params.ref = params.ref || "master";
		
		return params;
	}

	async show() {
		const params = this.parseParams({
			repopath: "string",
			filepath: "string",
			commitId: "string_optional",
		});

		const file = await this.gitStore.getFile(params).catch(e => undefined);
		if (!file) return this.fail("Not Found", 404);

		file.content = file.content.toString();

		return this.success(file);
	}

	async raw() {
		const params = this.parseParams({
			repopath: "string",
			filepath: "string",
			commitId: "string_optional",
		});

		const filename = _path.basename(params.filepath);
		const file = await this.gitStore.getFile(params).catch(e => undefined);
		if (!file) return this.fail("Not Found", 404);
		this.ctx.set("Cache-Control", "public, max-age=86400");
		const mimeType = mime.getType(filename);
		if (mimeType) {
			this.ctx.set("Content-Type", mimeType);
			if (mimeType.indexOf("text/") == 0) {
			} else if(mimeType.indexOf('image/') == 0) {
				this.ctx.set("Content-Disposition", `inline; filename=${filename}`);
			} else {
				this.ctx.set("Content-Disposition", `attachment; filename=${filename}`);
			}
		}

		return this.success(file.binary ? file.content : file.content.toString());
	}

	async save() {
		const params = this.parseParams({
			repopath: "string",
			filepath: "string",
			content: "string_optional",
			committer: "string_optional",
			message: "string_optional",
		});

		const data = await this.gitStore.saveFile(params);

		return this.success(data);
	}

	async destroy() {
		const params = this.parseParams({
			repopath: "string",
			filepath: "string",
			committer: "string_optional",
			message: "string_optional",
		});

		const data = await this.gitStore.deleteFile(params);

		return this.success(data);
	}

	async history() {
		const params = this.parseParams({
			repopath: "string",
			filepath: "string",
			commitId: "string_optional",
			maxCount: "number_optional",
		});

		const list = await this.gitStore.history(params)

		return this.success(list);
	}

	async getTreeByPath() {
		const params = this.parseParams({
			repopath: "string",
			filepath: "string",
			recursive: "boolean_optional",
			ref: "string_optional",
		});

		const tree = await this.gitStore.getTree(args);

		return this.success(tree);
	}

	async getTreeById() {
		const params = this.parseParams({
			repopath: "string",
			id: "string",
			recursive: "boolean_optional",
		});

		const tree = await this.gitStore.getTreeById(args);

		return this.success(tree);
	}

	async getArchive() {
		const params = this.parseParams({
			repopath: "string",
			ref:"string_optional",
		});
		
		const filepath = await this.gitStore.createArchive(params);
		const filestream = _fs.createReadStream(filepath, {emitClose: true});

		filestream.on("close", () => {
			_fs.unlinkSync(filepath);
		});

		this.ctx.set("Content-Description", "File Transfer");
		this.ctx.set("Content-Type", "application/octet-stream");
		this.ctx.set("Content-Transfer-Encoding", "binary");
		this.ctx.set("Expires", "0");
		this.ctx.set("Cache-Control", "must-revalidate");
		this.ctx.set("Pragma", "public");
		this.ctx.body = filestream;
	}
}

module.exports = File;
