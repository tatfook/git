'use strict';

module.exports = app => {
    const { router, controller } = app;

    const prefix = '/api/v0';

    router.get('/', controller.index.index);

    // 仓库
    const repo = controller.repo;
    router.post(`${prefix}/repo`, repo.create); // 仓库创建
    router.post(`${prefix}/repo/rename`, repo.rename); // 仓库重命名
    router.delete(`${prefix}/repo`, repo.destroy); // 仓库删除

    router.post(`${prefix}/repo/sync`, repo.sync); // 仓库同步
    router.get(`${prefix}/repo/commitInfo`, repo.commitInfo); // 获取commit信息

    // 仓库模式
    const file = controller.file;
    router.get(`${prefix}/file`, file.show); // 获取文件内容
    router.get(`${prefix}/file/info`, file.info); // 获取文件信息
    router.get(`${prefix}/file/raw`, file.raw); // 获取二进制文件
    router.post(`${prefix}/file/upload`, file.upload); // 文件上传
    router.post(`${prefix}/file/commit`, file.commit); // 文件提交
    router.post(`${prefix}/file`, file.save); // 创建文件
    router.post(`${prefix}/file/binary`, file.saveBinary); // 创建文件(二进制流)
    router.delete(`${prefix}/file`, file.destroy); // 删除文件
    router.get(`${prefix}/file/history`, file.history); // 获取文件历史
    router.get(`${prefix}/file/tree`, file.getTreeByPath); // 通过路径获取Tree
    router.get(`${prefix}/file/archive`, file.getArchive); // 通过Id获取Tree

    // 对象存储模式
    const object = controller.object;
    router.get(`${prefix}/object`, object.show); // 获取对象
    router.post(`${prefix}/object`, object.save); // 创建对象
    router.delete(`${prefix}/object`, object.destroy); // 删除对象
    router.get(`${prefix}/object/history`, object.history); // 获取对象历史
};
