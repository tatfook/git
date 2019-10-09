
const _path = require("path");
const _fs = require("fs");
const _ = require("lodash");
const Service = require('egg').Service;
const Git = require("nodegit");
const base64 = require('js-base64').Base64;
const AsyncQueue = require("@wxaxiaoyao/async-queue");

class GitService extends Service {
	get gitPath() {
		return this.config.GitServer.gitPath;
	}

	getRef({ref, path = ""}) {
		return ref ? `refs/heads/self/${ref}` : `refs/heads/sys/${base64.encode(path)}`;
	}

	async getRefCommit({repo, ref}) {
		try {
			return await repo.getReferenceCommit(ref);
		} catch(e) {
			return null;
		}
	}

	async getHeadCommit({repo, ref, path}) {
		ref = this.getRef({ref, path});
		return await this.getRefCommit({repo, ref});
	}

	async lock(path, timeout = 0) {
		const startTime = _.now();
		return new Promise((resolve, reject) => {
			const _lock = () => {
				try {
					_fs.mkdirSync(path);
					return resolve(true);
				} catch(e) {
					if (timeout && (_.now() - startTime) > timeout) return resolve(false);
					console.log(`仓库被锁定, 等待解锁: ${path}`);
					setTimeout(_lock, 100);
				} 
			}
			return _lock();
		});
	}

	unlock(path) {
		_fs.rmdirSync(path);
	}

	async openRepository({path}) {
		if (_fs.existsSync(path)) {
			return await Git.Repository.openBare(path);
		} else {
			const dir = _path.dirname(path);
			if (dir.length > this.gitPath.length) {
				await this.openRepository({path: dir});
			}
			return await Git.Repository.init(path, 1);
		}
	}

	parsePath(path) {
		const gitPath =  this.config.GitServer.gitPath;
		const lockPath =  this.config.GitServer.lockPath;

		path = _.trim(path, " " + _path.sep);
		if (path.indexOf(_path.sep) < 0) return {};

		path = _path.join(gitPath, path);
		const obj =  _path.parse(path);
		obj.repodir = (obj.dir || "") + ".git";
		obj.filename = obj.base || "";
		obj.lockpath = _path.join(lockPath, base64.encode(path));
		obj.path = path;

		return obj;
	}

	// 文件历史
	async history({path, commitId, maxCount = 100, ref}) {
		const obj = this.parsePath(path);
		const repodir = obj.repodir;
		const filename = obj.filename;
		path = obj.path;
		
		if (!repodir || !filename) return [];

		// 打开仓库
		const repo = await this.openRepository({path: repodir});
		if (!repo) {
			console.log("打开仓库失败");
			return;
		} 

		const commit = commitId ? await repo.getCommit(commitId) : await this.getHeadCommit({repo, ref, path});
		if (commit == null) return [];

		const revwalk = repo.createRevWalk();

		revwalk.push(commit.sha());

		const list = await revwalk.fileHistoryWalk(filename, maxCount);

		return list.map(entry => {
			const commit = entry.commit;
			return {
				committer: commit.author().name(),
				message: commit.message(),
				date: commit.date(),
				commitId: commit.sha(),
			}
		});
	}

	// 获取blob对象
	async getBlob({path, commitId, ref}) {
		const obj = this.parsePath(path);
		const repodir = obj.repodir;
		const filename = obj.filename;
		path = obj.path;
		if (!repodir || !filename) return ;

		// 打开仓库
		const repo = await this.openRepository({path: repodir});
		if (!repo) {
			console.log("打开仓库失败");
			return;
		} 

		// 获取commit
		const commit = commitId ? await repo.getCommit(commitId) : await this.getHeadCommit({repo, ref, path});
		if (!commit) {
			console.log("无提交记录");
			return;
		};

		// 获取tree entry
		let treeEntry = null;
		try {
			treeEntry = await commit.getEntry(filename);
		} catch(e) {
			console.log("入口项不存在");
			return;
		}

		// 获取对象 blob
		const blob = await treeEntry.getBlob();
		
		return blob;
	}

	// 获取文件内容
	async getFileContent({path, commitId}) {
		const blob = await this.getBlob({path, commitId});

		return blob ? blob.content : "";
	}

	async getFile({path, commitId}) {
		const blob = await this.getBlob({path, commitId});

		return blob ? {
			content: blob.toString(),
			rawcontent: blob.rawcontent(),
			size: blob.rawsize(),
			binary: blob.isBinary(),
			id: blob.id().tostrS(),
			mode: blob.filemode(),
		} : undefined;
	}

	// 保存文件
	async saveFile({path = "", content = "", message, committer, ref}) {
		const obj = this.parsePath(path);
		const repodir = obj.repodir;
		const filename = obj.filename;
		const lockpath = obj.lockpath;

		path = obj.path;

		if (!repodir || !filename) return ;

		ref = this.getRef({ref, path});
		message = message || `save file ${filename}`;
		committer = committer || "anonymous";

		// 签名
		const author = Git.Signature.now(committer, `example@mail.com`);
		const _committer = Git.Signature.now(committer, "example@mail.com");

		return await AsyncQueue.exec(repodir, async () => {
			// 进程锁
			const ok = await this.lock(lockpath, 10000);
			if (!ok) return console.log("this repository already lock!!!");

			// 打开仓库
			const repo = await this.openRepository({path: repodir});
			if (!repo) {
				this.unlock(lockpath);
				return;
			} 


			const parents = [];
			const headCommit = await this.getRefCommit({repo, ref});
			const buf = Buffer.from(content);
			const id = await Git.Blob.createFromBuffer(repo, buf, buf.length);
			const treeUpdate = new Git.TreeUpdate();
			treeUpdate.action = Git.Tree.UPDATE.UPSERT;
			treeUpdate.filemode = Git.TreeEntry.FILEMODE.BLOB;
			treeUpdate.id = id;
			treeUpdate.path = filename;

			let treeId = null;
			if (headCommit) {
				parents.push(headCommit);
				const tree = await headCommit.getTree();
				treeId = await tree.createUpdated(repo, 1, [treeUpdate]);
			} else {
				const index = await repo.refreshIndex();
				const tmpTreeId = await index.writeTree();
				const tree = await repo.getTree(tmpTreeId);
				treeId = await tree.createUpdated(repo, 1, [treeUpdate]);
			}	
			const tree = await repo.getTree(treeId);
			const commit = await Git.Commit.create(repo, ref, author, _committer, null, message, tree, parents.length, parents);
			this.unlock(lockpath);
			const blob = await repo.getBlob(id);

			//console.log("---------------------save file finish-----------------------");
			//return commit;
			return {
				content: blob.toString(),
				rawcontent: blob.rawcontent(),
				size: blob.rawsize(),
				binary: blob.isBinary(),
				id: blob.id().tostrS(),
				mode: blob.filemode(),
			}
		});
	}

	// 删除文件
	async deleteFile({path = "", ref, message, committer}) {
		const obj = this.parsePath(path);
		const repodir = obj.repodir;
		const filename = obj.filename;
		const lockpath = obj.lockpath;

		if (!repodir || !filename) return false;

		path = obj.path;
		ref = this.getRef({ref, path});
		message = message || `delete file ${filename}`;
		committer = committer || "anonymous";

		// 签名
		const author = Git.Signature.now(committer, `example@mail.com`);
		const _committer = Git.Signature.now(committer, "example@mail.com");

		return await AsyncQueue.exec(repodir, async () => {
			const ok = await this.lock(lockpath, 10000);
			if (!ok) return console.log("this repository already lock!!!");

			// 打开仓库
			const repo = await this.openRepository({path: repodir});
			if (!repo) {
				this.unlock(lockpath);
				return;
			} 


			const headCommit = await this.getRefCommit({repo, ref});
			if (headCommit == null) {
				this.unlock(lockpath);
				return false;
			}

			const parents = [headCommit];
			const headTree = await headCommit.getTree();
			const entry = headTree.entryByName(filename);
			if (!entry) {
				this.unlock(lockpath);
				return false;
			}

			const treeUpdate = new Git.TreeUpdate();
			treeUpdate.action = Git.Tree.UPDATE.REMOVE;
			treeUpdate.filemode = Git.TreeEntry.FILEMODE.BLOB;
			treeUpdate.id = entry.id();
			treeUpdate.path = filename;
			const treeId = await headTree.createUpdated(repo, 1, [treeUpdate]);
			const tree = await repo.getTree(treeId);

			// 提交
			const commit = await Git.Commit.create(repo, ref, author, _committer, null, message, tree, parents.length, parents);

			this.unlock(lockpath);
			//console.log("---------------------delete file finish-----------------------");
			return true;
		});
	}
}

module.exports = GitService;
