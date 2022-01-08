const chalk = require('chalk');

/**
 * @type {(()=>Promise<true|string>)[]}
 */
const tests = [];

/**
 * Add test to be run
 * @param cb
 */
export function test (cb) {
    tests.push(cb);
}

/**
 * @returns {Promise<TestRes>}
 */
export async function testAll () {
    backend(tests);

    const testRes = new TestRes();

    for (const test of tests) {
        const res = await test();
        if (res !== true) {
            testRes.fails.push(res);
        } else {
            testRes.passes++;
        }
    }

    return testRes;
}

export class TestRes {

    passes = 0;
    fails = [];

    str () {
        if (this.fails.length === 0) {
            return chalk.green`All tests Passed (${this.passes})`;
        }
        let out = `
            ${chalk.red(this.fails.length)}/${this.passes + this.fails.length} Tests Failed
        `;

    }
}