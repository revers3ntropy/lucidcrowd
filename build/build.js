/**
 * Builds and deploys the project to lucidcrowd.uk
 * OPTIONS:
 * --quiet       | limited console output
 * --silent      | no console output
 * --prod        | Deploy to production rather than staging.
 * --no-tests    | Don't run tests. Cannot be combined with --prod
 * --no-git      | Don't run git commit and git push
 * --no-frontend | Don't rebuild the HTML, CSS and JS
 * --no-backend  | Don't rebuild the python backend server
 * --no-upload   | Don't upload anything
 */

// utils
const fs = require('fs');
const {run, sortObjectEntries} = require('./utils');
const performanceNow = require("performance-now");
const now = () => Math.round(performanceNow());

// beatify
const chalk = require('chalk');
const Confirm = require('prompt-confirm');

const {testAll, testResStr} = require('./test.js');
const {failed} = require("./test");
const {buildHTML} = require('./buildHTMLPath');

const
	STAGING = !process.argv.includes('--prod'),
	timings = {
		'Compile TS': 0,
		'Compile LESS': 0
	},
	QUIET = process.argv.indexOf('--quiet') !== -1;

if (process.argv.indexOf('--silent') !== -1) {
	console = {
		log: () => {},
		error: () => {},
	};
}

let MAIN = '';

async function cpServer () {
	const start = now();

	const paths = fs.readdirSync('./server/');
	const distPath = `./dist/server${STAGING ? '-staging' : ''}/`;

	for (const path of paths) {
		if (
			fs.statSync('./server/' + path).isDirectory() ||
			path.split('.').pop() !== 'py'
		) {
			continue;
		}
		await run(`cp ./server/${path} ${distPath}`);
		if (STAGING) {
			// replace the port of the server with the staging one
			await run(`sed -i 's/56786/56787/g' ${distPath}/${path}`);
		}
	}

	timings[`Build Flask Server`] = now() - start;
}

async function upload () {
	const start = now();

	const paths = fs.readdirSync('./dist/');

	for (const path of paths) {
		console.log('Uploading path ' + path);
		if (fs.statSync('./dist/' + path).isDirectory()) {
			await run(
				`sshpass -f './build/sshPass.txt' scp -r ./dist/${path} lucid@lucidcrowd.uk:~/`);
			continue;
		}
		await run(
			`sshpass -f './build/sshPass.txt' scp ./dist/${path} lucid@lucidcrowd.uk:~/`);
	}

	console.log(chalk.green('Finished Uploading'));

	timings['Upload'] = now() - start;
}

function logTimings () {
	const namePadding = 60;
	const timePadding = 10;

	let width = namePadding + timePadding + 10;

	console.log('');
	console.log(` Timings `.padStart(width/2 + 4, '-').padEnd(width, '-'));

	const sortedTimings = sortObjectEntries(timings);

	let highlight = false;
	for (let key in sortedTimings) {
		let time = sortedTimings[key];
		let unit = 'ms';
		let decimalPlaces = 0;

		if (time > 1000) {
			time /= 1000;
			unit = 's ';
			decimalPlaces = 2;
		}

		let timeStr = chalk.yellow(time.toFixed(decimalPlaces).padStart(timePadding))
		if (highlight) {
			console.log('|' + chalk.bgBlack` ${key.padEnd(namePadding)} | ${timeStr} ${unit} ` + '|');
		} else {
			console.log(`| ${key.padEnd(namePadding)} | ${timeStr} ${unit} |`);
		}
		highlight = !highlight;
	}
	console.log(''.padStart(width, '-'))
}

async function buildWebpack () {
	const start = now();

	await run('webpack --config webpack.config.js > webpack_log.txt');
	if (!fs.existsSync('./webpack_out.js')) {
		console.error(chalk.red`NO WEBPACK OUTPUT!`);
		return;
	}
	MAIN = fs.readFileSync('./webpack_out.js');
	fs.unlinkSync('./webpack_out.js');

	timings['Build WebPack'] = now() - start;
}

/**
 * @returns {Promise<boolean>} Number of tests which failed
 */
async function runTests () {
	await testAll();
	if (!QUIET) console.log(testResStr());

	return failed();
}

async function main () {

	if (!STAGING) {
		if (process.argv.indexOf('--no-tests') !== -1) {
			console.log(chalk.red('MUST RUN TESTS WHEN DEPLOYING TO PRODUCTION'));
			return;
		}

		const prompt = new Confirm(chalk.blue('Are you sure you want to deploy to production?'));
		const res = await prompt.run();
		if (!res) {
			return;
		}
	}

	const start = now();

	if (process.argv.indexOf('--no-frontend') === -1) {
		if (!QUIET) console.log('Building WebPack...');
		await buildWebpack().catch(handleError);

		await buildHTML('', QUIET, STAGING, MAIN, timings, true).catch(handleError);
	}

	if (process.argv.indexOf('--no-backend') === -1) {
		if (!QUIET) console.log('Building Python Server...');
		await cpServer().catch(handleError);
	}

	let failingTests = false;

	if (process.argv.indexOf('--no-tests') === -1) {
		const testStart = now();
		failingTests = !(await runTests());
		timings['Tests'] = now() - testStart;
	}

	if (failingTests) {
		if (QUIET) {
			console.log('Remove "--quiet" to see failing tests');
		}
		if (STAGING) {
			const prompt = new Confirm(chalk.blue('Are you sure you want to continue with failing tests?'));
			const res = await prompt.run();
			if (!res) {
				return;
			}
		} else {
			console.log('Please fix tests to continue');
			return;
		}
	}

	if (process.argv.indexOf('--no-upload') === -1) {
		if (!QUIET) console.log('Uploading...');
		await upload().catch(handleError);
	}

	console.log(chalk.green`\nBuild Successful`);

	timings['Total'] = now() - start;

	if (!QUIET) logTimings();
}

function handleError (e) {
	console.log(e);
	console.log(chalk.red('\n Build Failed'));
	throw '';
}

try {
	main().catch(handleError);
} catch (e) {
	handleError(e)
}
