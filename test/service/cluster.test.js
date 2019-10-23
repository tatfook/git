
const fs = require("fs");
const { app, mock, assert  } = require('egg-mock/bootstrap');

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

	it ("redis", async () => {
		const ctx = app.mockContext();
		const cluster = ctx.service.cluster;

		const repopath = "test";
		const slave = await cluster.getSlave(repopath);
		console.log(slave);
	});

	it ("git", async () => {
		const config = app.config.GitServer;
		const ctx = app.mockContext();
		const cluster = ctx.service.cluster;
		const repopath = "test";
		const fileargs = {
			repopath,
			filepath: "file",
			content: "hello world",
			encoding: null,
			ref: "master",
		}

		// 移除仓库
		rmdir("data");

		// 主进程
		config.master = true;
		config.storePath = "data/master";
		app.gitStore.setOptions({storePath: config.storePath});

		let id = await cluster.saveFile({...fileargs, ref:undefined});
		console.log(id);

		config.master = false;
		config.storePath = "data/slave";
		config.hostname = "slave1";
		app.gitStore.setOptions({storePath: config.storePath});

		id = await cluster.saveFile(fileargs);
		console.log(id);

	});
});
