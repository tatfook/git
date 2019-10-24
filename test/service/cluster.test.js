
const fs = require("fs");
const { app, mock, assert  } = require('egg-mock/bootstrap');

const base64 = require('js-base64').Base64;

function rmdir(path){
    let files = [];
    if (fs.existsSync(path)) {
        files = fs.readdirSync(path);
        files.forEach((file, index) => {
            let curPath = path + "/" + file;
            if(fs.statSync(curPath).isDirectory()){
                rmdir(curPath); //递归删除文件夹
            } else {
                fs.unlinkSync(curPath); //删除文件
            }
        });
        fs.rmdirSync(path);
    }
}

describe("cluster", async () => {
	it ("reids", async() => {
		await app.redis.hincrby("hash", "master", 1);
		await app.redis.hincrby("hash", "slave", 1);
		console.log(await app.redis.hgetall("hash"));
	});

	it ("git", async () => {
		const config = app.config.GitServer;
		const ctx = app.mockContext();
		const cluster = ctx.service.cluster;
		const repopath = "test";
		const repostr = base64.encode(repopath);
		const fileargs = {
			repopath,
			filepath: "file",
			content: "hello world",
			encoding: null,
			ref: "master",
		}

		// 移除仓库
		rmdir("data");

		await app.redis.del(cluster.getRedisKey(`repo_info_${repostr}`));
		await app.redis.del(cluster.getRedisKey(`slaves`));

		// 主进程
		config.cluster.master = true;
		config.storePath = "data/master";
		app.gitStore.setOptions({storePath: config.storePath});

		let id = await cluster.saveFile({...fileargs, ref:undefined});
		console.log(id);

		config.cluster.master = false;
		config.cluster.hostname = "slave1";
		config.storePath = "data/slave";
		app.gitStore.setOptions({storePath: config.storePath});

		id = await cluster.saveFile({...fileargs, content: "commit 2"});
		console.log(id);

		// 切换至主进程
		config.cluster.master = true;
		config.storePath = "data/master";
		app.gitStore.setOptions({storePath: config.storePath});

		const file = await cluster.getFile({repopath, filepath:"file"});
		console.log(file.content.toString());
	});
});
