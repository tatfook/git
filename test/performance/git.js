
const _path = require("path");
const _ =  require("lodash");
const axios = require("axios");

const run = async () => {
	//const baseUrl = "http://10.28.18.13:7001/api/v0/";
	const baseUrl = "http://127.0.0.1:7001/api/v0/";
	const now = _.now();

	let failed = 0, success = 0;
	for (let i = 0; i < 1; i++) {
		const promises = [];
		const startTime = _.now();
		for (let j = 0; j < 50; j++) { 
			const repopath = `repo${j}`;
			//const filename = _.fill(Array(_.random(1, 3)), _.random(1, 100)).join("/");
			const filepath = "file_" +  _.random(0, 10000000);
			//console.log("提交文件: ", path);

			//await new Promise((resolve, reject) => {
				//setTimeout(() => resolve(true), _.random(100, 1000));
			//});

			promises.push(axios.post(`${baseUrl}file`, {
				repopath,
				filepath,
				content:"hello world",
				committer:"xiaoyao",
				message:"message",
			}, {
				headers: {
					"Authorization": "Bearer keepwork",
				},
				timeout: 10000,
			}).then( res => {
				success++;
			}).catch(e => {
				failed++;
				//console.log(e);
				//console.log(`失败 ${failed} 次`);
			}));
		}

		await Promise.all(promises);
		const endTime = _.now();
		console.log(`第 ${i + 1} 并发: ${endTime - startTime} ms`);
		//await new Promise((resolve, reject) => setTimeout(() => resolve(true), 2000));
	}

	const time = _.now() - now;

	console.log(`耗时: ${time} ms, 成功: ${success}, 失败: ${failed} 次`);
}

run();
