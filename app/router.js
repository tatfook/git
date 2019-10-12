
module.exports = app => {
	const {router, controller} = app;

	const prefix = "/api/v0";

	router.get("/", controller.index.index);
	
	// 仓库模式 
	const file = controller.file;
	router.get(`${prefix}/file`, file.show);                     // 获取文件
	router.post(`${prefix}/file`, file.save);                    // 创建文件
	router.delete(`${prefix}/file`, file.destroy);               // 创建文件
	router.get(`${prefix}/file/history`, file.history);          // 创建文件

	// 对象存储模式
	const object = controller.object;
	router.get(`${prefix}/object`, object.show);                  // 获取对象
	router.post(`${prefix}/object`, object.save);                 // 创建对象
	router.delete(`${prefix}/object`, object.destroy);            // 创建对象
	router.get(`${prefix}/object/history`, object.history);       // 创建对象
}
