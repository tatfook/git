const _ = require('lodash');
const { app, mock, assert } = require('egg-mock/bootstrap');
const AsyncQueue = require('@wxaxiaoyao/async-queue');

describe('async queue', async () => {
    it('001 sequence', async () => {
        const p1 = async () => {
            return await new Promise((resolve, reject) => {
                setTimeout(() => {
                    console.log('p1');
                    return resolve('p1');
                }, 1000);
            });
        };

        const p2 = async () => {
            return await new Promise((resolve, reject) => {
                setTimeout(() => {
                    console.log('p2');
                    return resolve('p2');
                }, 2000);
            });
        };

        const p3 = async () => {
            return await new Promise((resolve, reject) => {
                setTimeout(() => {
                    console.log('p3');
                    return resolve('p3');
                }, 3000);
            });
        };

        console.log(AsyncQueue.exec('', p1));
        console.log(
            AsyncQueue.exec('', () => {
                console.log('p0');
            })
        );
        console.log(AsyncQueue.exec('', p2));
        console.log(await AsyncQueue.exec('', p3));
    });

    it('002 count', async () => {
        let total = 0;
        const p = async () => {
            let count = total;
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    total = count + 1;
                    console.log('count: ', total);
                    return resolve(total);
                }, _.random(500, 2000));
            });
        };

        setTimeout(() => AsyncQueue.exec('', p), _.random(100, 1500));
        setTimeout(() => AsyncQueue.exec('', p), _.random(100, 1500));
        setTimeout(() => AsyncQueue.exec('', p), _.random(100, 1500));
        setTimeout(() => AsyncQueue.exec('', p), _.random(100, 1500));
        setTimeout(() => AsyncQueue.exec('', p), _.random(100, 1500));
        setTimeout(() => AsyncQueue.exec('', p), _.random(100, 1500));
        setTimeout(() => AsyncQueue.exec('', p), _.random(100, 1500));
        setTimeout(() => AsyncQueue.exec('', p), _.random(100, 1500));

        const wait = async () => {
            return new Promise((resolve, reject) => {
                setTimeout(async () => {
                    console.log(await AsyncQueue.exec('', p));
                    resolve(true);
                }, 5000);
            });
        };

        await wait();
    });
});
