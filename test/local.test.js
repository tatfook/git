

const _path = require("path");
const _ =  require("lodash");
const axios = require("axios");

const { app, mock, assert  } = require('egg-mock/bootstrap');

describe("local", async () => {

	it ("redis", async () => {
		let result = await app.redis.multi({pipeline: false});
		console.log(result);

		result = await app.redis.set("key", "hello world");
		console.log(result);
		
		result = await app.redis.get("key");
		console.log(result);
	});

	it("file", async () => {
		const repopath = "test";
		const ref = "master";
		const baseUrl = "http://127.0.0.1:7001/api/v0/file";
		const id = await axios.post(`${baseUrl}`, {
			repopath,
			ref,
			filepath: "file",
			content: "hello world",
			encoding: "ascii",
		});
		console.log(id);
	});

	it("gitea", async () => {
	})
})
