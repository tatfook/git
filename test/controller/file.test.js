
const { app, mock, assert  } = require('egg-mock/bootstrap');
const fs = require("fs");
const base64 = require('js-base64').Base64;

describe("file", () => {
	it("001 repository file", async () => {
		const ctx = app.mockContext();
		const token = "keepwork";
		const filepath = "test/file.txt";
		const repopath = "test";

		// 移除仓库
		ctx.helper.rm("data/git");

		// 保存文件
		const files = await Promise.all([
			await app.httpRequest().post("/api/v0/file").send({
				repopath,
				filepath: "test/file.txt",
				encoding: "base64",
				content: base64.encode("hello world"),
			}).set("Authorization", `Bearer ${token}`).expect(res => assert(res.statusCode == 200)).then(res => res.body),

			await app.httpRequest().post("/api/v0/file").send({
				repopath,
				filepath: "test/dir/file.txt",
				encoding: "base64",
				content: base64.encode("hello world"),
			}).set("Authorization", `Bearer ${token}`).expect(res => assert(res.statusCode == 200)).then(res => res.body),

			await app.httpRequest().post("/api/v0/file").send({
				repopath,
				filepath: "test/file.txt",
				encoding: "base64",
				content: base64.encode("hello world2"),
			}).set("Authorization", `Bearer ${token}`).expect(res => assert(res.statusCode == 200)).then(res => res.body),

		]);
		assert(files.length == 3);

		const archive = await app.httpRequest().get("/api/v0/file/archive").send({
			repopath,
			filepath: "test/file.txt",
		}).set("Authorization", `Bearer ${token}`).expect(res => assert(res.statusCode == 200)).then(res => res.body);
		fs.writeFileSync("archive.zip", archive);
		
		// 移除文件
		const commit = await app.httpRequest().delete("/api/v0/file").send({
			repopath,
			filepath: "test/file.txt",
		}).set("Authorization", `Bearer ${token}`).expect(res => assert(res.statusCode == 200)).then(res => res.body);
		assert(commit);

		// 提交历史
		const list = await app.httpRequest().get(`/api/v0/file/history?filepath=${filepath}&repopath=${repopath}`).set("Authorization", `Bearer ${token}`).expect(res => assert(res.statusCode == 200)).then(res => res.body);
		//console.log(list);
		assert(list.length == 3);

		let commitId = list[0].commitId;
		let file = await app.httpRequest().get(`/api/v0/file?filepath=${filepath}&repopath=${repopath}&commitId=${commitId}`).set("Authorization", `Bearer ${token}`).expect(res => assert(res.statusCode == 404)).catch(_ => {});

		commitId = list[1].commitId;
		file = await app.httpRequest().get(`/api/v0/file?filepath=${filepath}&repopath=${repopath}&commitId=${commitId}`).set("Authorization", `Bearer ${token}`).expect(res => assert(res.statusCode == 200)).then(res => res.body);
		assert(base64.decode(file.content), "hello world2");

		commitId = list[2].commitId;
		file = await app.httpRequest().get(`/api/v0/file?filepath=${filepath}&repopath=${repopath}&commitId=${commitId}`).set("Authorization", `Bearer ${token}`).expect(res => assert(res.statusCode == 200)).then(res => res.body);
		//console.log(file);
		assert(base64.decode(file.content), "hello world");
	});

    it ("002 upload commit", async () => {
		const ctx = app.mockContext();
		const token = "keepwork";
		const filepath = "test/file.txt";
		const repopath = "test";

        ctx.helper.rm("data/git");

        const sha1 = await app.httpRequest().post("/api/v0/file/upload").send({
            repopath,
            encoding: "base64",
            content: base64.encode("file1 hello world"),
        }).set("Authorization", `Bearer ${token}`).expect(res => assert(res.statusCode == 200)).then(res => res.text);
        assert(sha1);

        const sha2 = await app.httpRequest().post("/api/v0/file/upload").send({
            repopath,
            encoding: "base64",
            content: base64.encode("file2 hello world"),
        }).set("Authorization", `Bearer ${token}`).expect(res => assert(res.statusCode == 200)).then(res => res.text);
        assert(sha2);
        
        const sha3 = await app.httpRequest().post("/api/v0/file/upload").send({
            repopath,
            encoding: "base64",
            content: base64.encode("file3 hello world"),
        }).set("Authorization", `Bearer ${token}`).expect(res => assert(res.statusCode == 200)).then(res => res.text);
        assert(sha3);

        let commitId = await app.httpRequest().post("/api/v0/file/commit").send({
            repopath,
            files: [
                {
                    path: "file1",
                    id: sha1,
                    action: "upsert",
                },
                {
                    path: "file2",
                    id: sha2,
                    action: "upsert",
                },
                {
                    path: "dir/file3",
                    id: sha3,
                    action: "upsert",
                },
            ]
        }).set("Authorization", `Bearer ${token}`).expect(res => assert(res.statusCode == 200)).then(res => res.text);
        assert(commitId);

        commitId = await app.httpRequest().post("/api/v0/file/commit").send({
            repopath,
            files: [
                {
                    path: "dir/file3",
                    id: sha3,
                    action: "remove",
                },
                {
                    path: "test/file3",
                    id: sha3,
                    action: "upsert",
                },
            ]
        }).set("Authorization", `Bearer ${token}`).expect(res => assert(res.statusCode == 200)).then(res => res.text);
        assert(commitId);
		// 提交历史
		const list = await app.httpRequest().get(`/api/v0/file/history?filepath=test/file3&repopath=${repopath}`).set("Authorization", `Bearer ${token}`).expect(res => assert(res.statusCode == 200)).then(res => res.body);
        assert(list.length === 1);
    });

    it ("003 tree", async () => {
		const ctx = app.mockContext();
		const token = "keepwork";
		const filepath = "test/file.txt";
		const repopath = "test";

        ctx.helper.rm("data/git");

        const sha1 = await app.httpRequest().post("/api/v0/file/upload").send({
            repopath,
            encoding: "base64",
            content: base64.encode("file1 hello world"),
        }).set("Authorization", `Bearer ${token}`).expect(res => assert(res.statusCode == 200)).then(res => res.text);
        assert(sha1);

        const sha2 = await app.httpRequest().post("/api/v0/file/upload").send({
            repopath,
            encoding: "base64",
            content: base64.encode("file2 hello world"),
        }).set("Authorization", `Bearer ${token}`).expect(res => assert(res.statusCode == 200)).then(res => res.text);
        assert(sha2);
        
        const sha3 = await app.httpRequest().post("/api/v0/file/upload").send({
            repopath,
            encoding: "base64",
            content: base64.encode("file3 hello world"),
        }).set("Authorization", `Bearer ${token}`).expect(res => assert(res.statusCode == 200)).then(res => res.text);
        assert(sha3);

        let commitId = await app.httpRequest().post("/api/v0/file/commit").send({
            repopath,
            files: [
                {
                    path: "file1",
                    id: sha1,
                    action: "upsert",
                },
                {
                    path: "file2",
                    id: sha2,
                    action: "upsert",
                },
                {
                    path: "dir/file3",
                    id: sha3,
                    action: "upsert",
                },
            ]
        }).set("Authorization", `Bearer ${token}`).expect(res => assert(res.statusCode == 200)).then(res => res.text);
        assert(commitId);
        
        let tree = await app.httpRequest().get(`/api/v0/file/tree?repopath=${repopath}`).expect(res => assert(res.statusCode === 200)).then(res => res.body);
        assert(tree.length == 3)

    });
});

