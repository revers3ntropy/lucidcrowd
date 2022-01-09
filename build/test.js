const fs = require('fs');
const chalk = require('chalk');

/**
 * @type {(()=>Promise<true|string>)[]}
 */
const tests = [
    () => tests.length > 1 || 'No tests loaded',
];

function stringify (s) {
    switch (typeof s) {
        case 'undefined':
            return 'Undefined';
        case 'object':
            try {
                return JSON.stringify(s);
            } catch (e) {}
        default:
            return s.toString();
    }
}

function deepCompare () {
    var i, l, leftChain, rightChain;
    function compare2Objects (x, y) {
        var p;
        // remember that NaN === NaN returns false
        // and isNaN(undefined) returns true
        if (isNaN(x) && isNaN(y) && typeof x === 'number' && typeof y === 'number') {
            return true;
        }
        // Compare primitives and functions.
        // Check if both arguments link to the same object.
        // Especially useful on the step where we compare prototypes
        if (x === y) {
            return true;
        }
        // Works in case when functions are created in constructor.
        // Comparing dates is a common scenario. Another built-ins?
        // We can even handle functions passed across iframes
        if ((typeof x === 'function' && typeof y === 'function') ||
            (x instanceof Date && y instanceof Date) ||
            (x instanceof RegExp && y instanceof RegExp) ||
            (x instanceof String && y instanceof String) ||
            (x instanceof Number && y instanceof Number)) {
            return x.toString() === y.toString();
        }
        // At last checking prototypes as good as we can
        if (!(x instanceof Object && y instanceof Object)) {
            return false;
        }
        if (x.isPrototypeOf(y) || y.isPrototypeOf(x)) {
            return false;
        }
        if (x.constructor !== y.constructor) {
            return false;
        }
        if (x.prototype !== y.prototype) {
            return false;
        }
        // Check for infinitive linking loops
        if (leftChain.indexOf(x) > -1 || rightChain.indexOf(y) > -1) {
            return false;
        }
        // Quick checking of one object being a subset of another.
        // todo: cache the structure of arguments[0] for performance
        for (p in y) {
            if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
                return false;
            }
            else if (typeof y[p] !== typeof x[p]) {
                return false;
            }
        }
        for (p in x) {
            if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
                return false;
            }
            else if (typeof y[p] !== typeof x[p]) {
                return false;
            }
            switch (typeof (x[p])) {
                case 'object':
                case 'function':
                    leftChain.push(x);
                    rightChain.push(y);

                    if (!compare2Objects (x[p], y[p])) {
                        return false;
                    }

                    leftChain.pop();
                    rightChain.pop();
                    break;

                default:
                    if (x[p] !== y[p]) {
                        return false;
                    }
                    break;
            }
        }
        return true;
    }
    if (arguments.length < 1) {
        return true; //Die silently? Don't know how to handle such case, please help...
        // throw "Need two or more arguments to compare";
    }
    for (i = 1, l = arguments.length; i < l; i++) {
        leftChain = [];
        rightChain = [];
        if (!compare2Objects(arguments[0], arguments[i])) {
            return false;
        }
    }
    return true;
}


/**
 * Add test to be run
 * @param cb
 */
exports.test = (cb) => {
    tests.push(cb);
};

function test (cb) {
    return (val2) => {
        const res = cb(val2);
        if (res !== true) {
            fails.push(res);
        } else {
            passes++;
        }
    }
}

exports.expect = (val1) => {
    return {
        toBe: test((val2) =>
            val1 === val2 || `'${stringify(val1)}' was expected to be '${stringify(val2)}'`),
        toNotBe: test((val2) =>
            val1 !== val2 || `'${stringify(val1)}' was expected to not be '${stringify(val2)}'`),
        toEq: test((val2) =>
            deepCompare(val1,  val2) || `'${stringify(val1)}' was expected to equal '${stringify(val2)}'`),
        toNotEq: test((val2) =>
            !deepCompare(val1, val2) || `'${stringify(val1)}' was expected to not equal '${stringify(val2)}'`),
        toBeGT: test((val2) =>
            val1 > val2 || `'${stringify(val1)}' was expected to be greater than '${stringify(val2)}'`),
        toBeLT: test((val2) =>
            val1 < val2 || `'${stringify(val1)}' was expected to not equal '${stringify(val2)}'`),
        toHaveType: test((type) =>
            (typeof val1 === type) || `'${stringify(val1)}' was expected to be of type '${stringify(type)}'`),

    };
};

/**
 * @returns {Promise<void>}
 */
exports.testAll = async () => {
    fs.readdirSync('build/tests')
        .forEach(file => void require("./tests/" + file));

    for (const test of tests) {
        const res = await test();
        if (res !== true) {
            fails.push(res);
        } else {
            passes++;
        }
    }
};

passes = 0;
fails = [];
exports.failed = () => fails.length === 0;

exports.testResStr = () => {
    if (fails.length === 0) {
        return chalk.green`     All tests Passed (${passes})`;
    }
    let out = `
         ${chalk.red(fails.length)} Tests Failed (/${passes + fails.length})
         `;
    for (let fail of fails) {
        out += '\n' + fail + '\n';
    }
    return out;
};