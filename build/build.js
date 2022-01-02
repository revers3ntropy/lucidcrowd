const { exec } = require("child_process");
const fs = require('fs');
const p = require('path');
const minifyHTML = require('html-minifier').minify;
const uglifyJS = require('uglify-js').minify;
const performanceNow = require("performance-now");
const now = () => Math.round(performanceNow());

const HEAD = fs.readFileSync('./header.html');
const FOOT = fs.readFileSync('./footer.html');
let MAIN = '';

let JSTime = 0;
let CSSTime = 0;

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

async function buildHTML (dir) {
	const start = now();

	const paths = fs.readdirSync('./src/' + dir);

	const distPath = p.join('./dist/public_html', dir);

	let html = '';
	let css = '';
	let js = '';

	for (const path of paths) {
		const fullPath = './src/' + dir + "/" + path;

		if (fs.statSync(fullPath).isDirectory()) {
			await buildHTML(dir + "/" + path);
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
			const fileContent = fs.readFileSync(`${distPath}/index.css`);
			fs.unlinkSync(`${distPath}/index.css`);

			css = '<style>' + fileContent + '</style>';
			CSSTime += now() - start;
		}

		else if (path === 'index.ts') {
			const start = now();

			await run (`tsc --outDir ${distPath} ${fullPath}`);
			const fileContent = String(fs.readFileSync(`${distPath}/index.js`));
			fs.unlinkSync(`${distPath}/index.js`);

			const minified = uglifyJS(fileContent, {});

			if (minified.error) {
				console.error(`UglifyJS error: ${minified.error}`);
				return;
			}
			if (minified.warnings) {
				console.log(minified.warnings);
			}

			js = '<script defer>' + minified.code + '</script>';
			JSTime += now() - start;
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

	console.log(`Built '${distPath}' in ${now() - start} ms`);

	fs.writeFileSync(distPath + '/index.html', final);
}

async function cpServer () {
	await run(`cp ./server/app.py ./dist/server/app.py`);
	await run(`cp ./server/connectmysql.py ./dist/server/connectmysql.py`);
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


	console.log(`Upload took ${now() - start} ms`)
}

async function main () {

	const start = now();

	await run ('cd ..');

	await run('webpack --config webpack.config.js');
	if (!fs.existsSync('./webpack_out.js')) {
		console.error('NO WEBPACK OUTPUT!');
		return;
	}
	MAIN = fs.readFileSync('./webpack_out.js');
	fs.unlinkSync('./webpack_out.js');
	await buildHTML('');

	console.log(`TS compilation took ${JSTime} ms`);
	console.log(`LESS compilation took ${CSSTime} ms`);

	await cpServer();

	await upload();

	console.log(`\nBuilt project and uploaded in ${now() - start} ms`);
}

main();