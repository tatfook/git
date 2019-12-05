const _path = require('path');
const _ = require('lodash');
const axios = require('axios');

const init = async () => {
    const baseUrl = 'http://10.28.18.13:3000/api/v1';
    const token = '6f7c54242184d13c6a0dae7dc9f9757856345a90';
    for (let i = 0; i < 1000; i++) {
        const repo = `repo${i}`;
        await axios
            .post(
                `${baseUrl}/user/repos`,
                {
                    name: repo,
                    private: true,
                    auto_init: true,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )
            .catch(e => {});
    }
};

//init();

const run = async () => {
    const baseUrl = 'http://10.28.18.13:3000/api/v1';
    const token = '6f7c54242184d13c6a0dae7dc9f9757856345a90';
    const now = _.now();

    let failed = 0,
        success = 0;
    const files = {};

    for (let count = 0; count < 100; count++) {
        const promises = [];
        const startTime = _.now();
        for (let i = 0; i < 50; i++) {
            const repo = `repo${i}`;
            const filename = _.random(0, 10000000);
            const path = `${repo}/${filename}`;
            //console.log("提交文件: ", path);

            promises.push(
                axios[files[path] ? 'put' : 'post'](
                    `${baseUrl}/repos/xiaoyao/${repo}/contents/${filename}`,
                    {
                        shaa: files[path],
                        content:
                            'JXU4RkQ5JXU5MUNDJXU2NjJGJXU4OTgxJXU1MkEwJXU1QkM2JXU3Njg0JXU1MTg1JXU1QkI5JXVGRjAx',
                        message: 'message',
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        timeout: 120000,
                    }
                )
                    .then(res => {
                        const data = res.data.content;
                        files[path] = data.sha;
                        success++;
                    })
                    .catch(e => {
                        failed++;
                        //console.log(e);
                        //console.log(`失败 ${failed} 次`);
                    })
            );
        }
        await Promise.all(promises);
        const endTime = _.now();
        console.log(`第 ${count} 并发耗时: ${endTime - startTime} ms`);
    }

    const time = _.now() - now;

    console.log(`耗时: ${time} ms, 成功: ${success}, 失败: ${failed} 次`);
};

run();
