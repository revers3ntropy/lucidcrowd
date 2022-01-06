const backend = require('./backend.js').default;
const chalk = require('chalk');

const tests = [];

export function testAll () {
    backend(tests);

    const testRes = new TestRes();

    for (const test in tests) {
        res = test();
        if (res !== true) {
            testRes.fails.push(res);
        } else {
            restRes.passes++;
        }
    }
}

export class TestRes {

    passes = 0;
    fails = [];

    str () {
        if (fails.length === 0) {
            return chalk.green`All tests Passed (${this.passes})`;
        }
        let out = `
            ${chalk.red(this.fails.length)}/${passes + this.fails.length} Tests Failed
        `;

    }
}