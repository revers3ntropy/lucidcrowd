const { exec } = require("child_process");
const fs = require('fs');
const p = require('path');

// uglify
const minifyHTML = require('html-minifier').minify;
const uglifyJS = require('uglify-js').minify;

// beatify
const chalk = require('chalk');
const Confirm = require('prompt-confirm');
const cliProgress = require('cli-progress');

// timings
const performanceNow = require("performance-now");
const now = () => Math.round(performanceNow());


const
	HEAD = fs.readFileSync('./header.html'),
	FOOT = fs.readFileSync('./footer.html'),
	STAGING = !process.argv.includes('--prod'),
	timings = {
		'Compile TS': 0,
		'Compile LESS': 0
	};

let MAIN = '';

/**
 * @param {string} cmd
 * @returns {Promise<void>}
 */
function run (cmd) {
	return new Promise((e) => {
		exec(cmd, (error, stdout, stderr) => {
			if (error) console.error(error);
			if (stdout) console.error(stdout);
			if (stderr) console.error(stderr);
			e();
		});
	});
}

/**
 * @param {string} dir
 * @returns {Promise<number>}
 */
async function buildHTML (dir) {
	const start = now();

	const paths = fs.readdirSync('./src/' + dir);

	const distPath = p.join('./dist/public_html' + (STAGING ? '/staging' : ''), dir);

	let html = '';
	let css = '';
	let js = '';

	let subDirTime = 0;

	for (const path of paths) {
		const fullPath = './src' + dir + "/" + path;

		if (fs.statSync(fullPath).isDirectory()) {
			subDirTime += await buildHTML('/' + dir + "/" + path);
			continue;
		}

		if (path === 'index.html') {
			html = `
				${HEAD}
				${fs.readFileSync(fullPath)}
				${FOOT}
			`;
		}

		else if (path === 'index.less') {
			const start = now();
			await run (`lessc ${fullPath} ${distPath}/index.css`);
			if (!fs.existsSync(`${distPath}/index.css`)) {
				console.log(chalk.red`FILE '${distPath}/index.css' REQUIRED!`)
				continue;
			}
			const fileContent = fs.readFileSync(`${distPath}/index.css`);
			fs.unlinkSync(`${distPath}/index.css`);

			css = '<style>' + fileContent + '</style>';
			timings['Compile LESS'] += now() - start;
		}

		else if (path === 'index.ts') {
			const start = now();

			await run (`tsc --outDir ${distPath} ${fullPath}`);
			if (!fs.existsSync(`${distPath}/index.js`)) {
				console.log(chalk.red`FILE '${distPath}/index.js' REQUIRED!`)
				continue;
			}
			const fileContent = String(fs.readFileSync(`${distPath}/index.js`));
			fs.unlinkSync(`${distPath}/index.js`);

			const minified = uglifyJS(fileContent, {});

			if (minified.error) {
				console.error(`UglifyJS error: ${minified.error}`);
				return now() - start - subDirTime;
			}
			if (minified.warnings) {
				console.log(minified.warnings);
			}

			js = '<script defer>' + minified.code + '</script>';
			timings['Compile TS'] += now() - start;
		}
	}

	if (!fs.existsSync(distPath) && html) {
		fs.mkdirSync(distPath);
	}

	// main.ts, main.less
	js = '<script>' + MAIN + '</script>' + js;

	const final = minifyHTML(html + css + js, {
		removeAttributeQuotes: false,
		removeComments: true,
		removeRedundantAttributes: false,
		removeScriptTypeAttributes: false,
		removeStyleLinkTypeAttributes: false,
		sortClassName: true,
		useShortDoctype: true,
		collapseWhitespace: true
	});

	fs.writeFileSync(distPath + '/index.html', final);

	let time = now() - start - subDirTime;

	timings[`'${distPath}' front-end path`] = time;

	return time;
}

async function cpServer () {
	const start = now();

	const paths = fs.readdirSync('./server/');

	const distPath = `./dist/server${STAGING ? '-staging' : ''}/`;

	for (const path of paths) {
		if (fs.statSync('./server/' + path).isDirectory()) {
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
		if (fs.statSync('./dist/' + path).isDirectory()) {
			await run(
				`sshpass -f './build/sshPass.txt' scp -r /home/joseph/Projects/lucidcrowd/dist/${path} lucid@lucidcrowd.uk:~/`);
			continue;
		}
		await run(
			`sshpass -f './build/sshPass.txt' scp /home/joseph/Projects/lucidcrowd/dist/${path} lucid@lucidcrowd.uk:~/`);
	}


	timings['Upload'] = now() - start;
}

//src: https://stackoverflow.com/questions/1069666/sorting-object-property-by-values
function sortObjectEntries (obj) {
	let sortable = [];
	for (let vehicle in obj) {
		sortable.push([vehicle, obj[vehicle]]);
	}

	sortable.sort((a, b) => a[1] - b[1]);

	let objSorted = {}
	sortable.forEach(function(item){
		objSorted[item[0]] = item[1]
	});

	return objSorted
}

function logTimings () {
	const namePadding = 60;
	const timePadding = 10;

	let width = namePadding + timePadding + 10;

	console.log('');
	console.log(` Timings `.padStart(width/2 + 4, '-').padEnd(width, '-'));

	const sortedTimings = sortObjectEntries(timings);

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
		console.log(`| ${key.padEnd(namePadding)} | ${timeStr} ${unit} |`);
	}
	console.log(''.padStart(width, '-'))
}

async function buildWebpack () {
	const start = now();

	await run('webpack --config webpack.config.js >/dev/null');
	if (!fs.existsSync('./webpack_out.js')) {
		console.error(chalk.red`NO WEBPACK OUTPUT!`);
		return;
	}
	MAIN = fs.readFileSync('./webpack_out.js');
	fs.unlinkSync('./webpack_out.js');

	timings['Build WebPack'] = now() - start;
}

async function main () {

	if (!STAGING) {
		const prompt = new Confirm(chalk.blue('Are you sure you want to deploy to production?'));
		const res = await prompt.run();
		if (!res) {
			return;
		}
	}

	const start = now();
	const mainProgressBar = new cliProgress.SingleBar({
		format: 'CLI Progress |' + chalk.cyan('{bar}') + '| {percentage}% || {value}/{total} Chunks || Speed: {speed}',
		barCompleteChar: '\u2588',
		barIncompleteChar: '\u2591',
		hideCursor: true
	});

	mainProgressBar.start(100, 0, {
		speed: 'N/A'
	});

	let interval = setInterval(() => mainProgressBar.increment(), 250);

	if (process.argv.indexOf('--no-frontend') === -1) {
		await buildWebpack();
		mainProgressBar.update(25);

		await buildHTML('');
		mainProgressBar.update(70);
	}

	if (process.argv.indexOf('--no-backend') === -1) {
		await cpServer();
		mainProgressBar.update(75);
	}

	if (process.argv.indexOf('--no-upload') === -1) {
		await upload();
		mainProgressBar.update(99);
	}

	clearInterval(interval);
	mainProgressBar.update(100);
	mainProgressBar.stop();

	console.log(chalk.green`\nBuild Successful`);

	timings['total'] = now() - start;

	logTimings();
}

function handleError (e) {
	console.log(e);
	console.log(chalk.red('\n Build Failed'));
}

try {
	main().catch(handleError);
} catch (e) {
	handleError(e)
}
