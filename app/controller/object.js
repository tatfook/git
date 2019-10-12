const _path = require("path");
const Git = require("nodegit");

const Controller = require("../core/controller.js");

class Object_ extends Controller {

	get gitStore() {
		return this.app.gitStore;
	}

	parseParams(rule = {}) {
		const {uid} = this.authenticated();

		const params = this.validate({...rule, path: "string"});

		const path = _path.join(uid, params.path);
		const obj = _path.parse(path);
		params.repopath = obj.dir;
		params.filepath = obj.base;
		
		return params;
	}

	async show() {
		const params = this.parseParams({
			commitId: "string_optional",
		});

		const file = await this.gitStore.getFile(params).catch(e => undefined);
		if (!file) return this.fail("Not Found", 404);

		file.rawcontent = undefined;

		return this.success(file);
	}

	async rowcontent() {
		// 二进制数据
	}

	async save() {
		const params = this.parseParams({
			path: "string",
			content: "string_optional",
			committer: "string_optional",
			message: "string_optional",
		});

		const data = await this.gitStore.saveFile(params);

		return this.success(data);
	}

	async destroy() {
		const params = this.parseParams({
			path: "string",
			committer: "string_optional",
			message: "string_optional",
		});

		const data = await this.gitStore.deleteFile(params);

		return this.success(data);
	}

	async history() {
		const params = this.parseParams({
			path: "string",
			commitId: "string_optional",
			maxCount: "number_optional",
		});
		
		const list = await this.gitStore.history(params)

		return this.success(list);
	}

}

module.exports = Object_;
