
const { app, mock, assert  } = require('egg-mock/bootstrap');
const _path = require("path");
const fs = require("fs");

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

function getFiles(path) {
	let files = [];
	if (!fs.existsSync(path)) return [];
	if (!fs.statSync(path).isDirectory()) return [path];
	fs.readdirSync(path).forEach((file) => files = files.concat(getFiles(_path.join(path, file))));
	return files;
}

describe("world", () => {
	it("001 share world", async () => {
		const ctx = app.mockContext();
		const token = "keepwork";
		const repopath = "world";
		const worldpath = "data/world";

		// 移除仓库
		//fs.rmdirSync("repository/test.git", {recursive: true});
		rmdir("data/git");

		const files = getFiles(worldpath);
		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			//const content = fs.readFileSync(filepath, {encoding: "utf8"});
			const content = fs.readFileSync(file);
			const filepath = _path.relative(worldpath, file);
			console.log(filepath, content.length, content.toString("hex").length);
			await app.httpRequest().post("/api/v0/file").send({
				repopath,
				filepath,
				encoding: "base64",
				content: content.toString("base64"),
			}).set("Authorization", `Bearer ${token}`).expect(res => assert(res.statusCode == 200)).then(res => res.body);
			await app.httpRequest().get(`/api/v0/file/raw?filepath=${filepath}&repopath=${repopath}`).set("Authorization", `Bearer ${token}`).expect(res => assert(res.statusCode == 200)).then(res => res.body).catch(e => console.log("not fount:--------", filepath));
			//console.log(file);
		}

		const archive = await app.httpRequest().get("/api/v0/file/archive").send({
			repopath,
			filepath: "test/file.txt",
		}).set("Authorization", `Bearer ${token}`).expect(res => assert(res.statusCode == 200)).then(res => res.body);
		//fs.writeFileSync("archive.zip", archive);

		return ;
	});

	it("002 file encoding", async () => {
		const filepath = 'data/world/preview.jpg';
		const buf = fs.readFileSync(filepath);
		console.log("buf: ", buf.length);
		const str = buf.toString();
		console.log("str: ", str.length);
		const newbuf = Buffer.from(str, "utf8");
		console.log("newbuf: ", newbuf.length);

		const b = Buffer.from("hello world");
		console.log(b.length);
		const bb = Buffer.from(b.toString("utf8"), "utf8");
		console.log(bb.length);
	});
});

