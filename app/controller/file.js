const _path = require("path");
const Git = require("nodegit");

const Controller = require("../core/controller.js");

class File extends Controller {

	get gitStore() {
		return this.app.gitStore;
	}

	parseParams(rule = {}) {
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

		file.rawcontent = undefined;

		return this.success(file);
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

}

module.exports = File;
