const _path = require('path');
const _ = require('lodash');
const axios = require('axios');
const Git = require('nodegit');
const base64 = require('js-base64').Base64;

const { app, mock, assert } = require('egg-mock/bootstrap');

function rmdir(path) {
    let files = [];
    if (fs.existsSync(path)) {
        files = fs.readdirSync(path);
        files.forEach((file, index) => {
            let curPath = path + '/' + file;
            if (fs.statSync(curPath).isDirectory()) {
                rmdir(curPath); //递归删除文件夹
            } else {
                fs.unlinkSync(curPath); //删除文件
            }
        });
        fs.rmdirSync(path);
    }
}

describe('nodegit', async () => {
    it('nodegit', async () => {
        const path = 'repository/git';
        //rmdir(path);

        const ref = `refs/heads/${base64.encode(path)}`;
        const repo = await Git.Repository.openBare(path);

        let tree = null;
        let headCommit = null;
        try {
            headCommit = await repo.getReferenceCommit(ref);
        } catch (e) {
            headCommit = null;
        }
        if (headCommit) {
            tree = await headCommit.getTree();
        } else {
            const index = await repo.refreshIndex();
            let treeId = await index.writeTree();
            tree = await repo.getTree(treeId);
        }

        let count = tree.entryCount();
        for (let i = 0; i < count; i++) {
            const entry = tree.entryByIndex(i);
            if (entry.isTree()) console.log(entry.sha(), entry.oid());
        }
        const buf = Buffer.from('hello world1');
        const id = await Git.Blob.createFromBuffer(repo, buf, buf.length);
        const filename = 'a/b/c';
        const treeUpdate = new Git.TreeUpdate();
        treeUpdate.action = Git.Tree.UPDATE.UPSERT;
        treeUpdate.filemode = Git.TreeEntry.FILEMODE.BLOB;
        treeUpdate.id = id;
        treeUpdate.path = filename;
        const treeId = await tree.createUpdated(repo, 1, [treeUpdate]);
        tree = await repo.getTree(treeId);

        for (let i = 0; i < count; i++) {
            const entry = tree.entryByIndex(i);
            if (entry.isTree()) console.log(entry.sha(), entry.oid());
        }

        const message = `save file ${filename}`;
        const committer = 'anonymous';
        const author = Git.Signature.now(committer, `example@mail.com`);
        const _committer = Git.Signature.now(committer, 'example@mail.com');
        const parents = headCommit == null ? [] : [headCommit];
        await Git.Commit.create(
            repo,
            ref,
            author,
            _committer,
            null,
            message,
            tree,
            parents.length,
            parents
        );
    });
});
