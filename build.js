const { exec } = require("child_process");
const fs = require('fs');
const p = require('path');
const minify = require('html-minifier').minify;

const HEAD = fs.readFileSync('./header.html');
const FOOT = fs.readFileSync('./footer.html');
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

async function buildHTML (dir) {
	const paths = fs.readdirSync('./src/' + dir);

	const distPath = p.join('./dist/public_html', dir);

	let html = '';
	let css = '';
	let js = '';

	for (const path of paths) {
		const fullPath = './src/' + dir + "/" + path;

		if (fs.statSync(fullPath).isDirectory()) {
			buildHTML(dir + "/" + path);
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
			await run (`lessc ${fullPath} ${distPath}/index.css`);
			css = '<style>' + fs.readFileSync(`${distPath}/index.css`) + '</style>';
			fs.unlinkSync(`${distPath}/index.css`);
		}

		else if (path === 'index.ts') {
			await run (`tsc --outDir ${distPath} ${fullPath}`);
			js = '<script defer>' + fs.readFileSync(`${distPath}/index.js`) + '</script>';
			fs.unlinkSync(`${distPath}/index.js`);
		}
	}

	if (!fs.existsSync(distPath) && html) {
		fs.mkdirSync(distPath);
	}

	// main.ts, main.less
	js += '<script>' + MAIN + '</script>';

	const final = minify(html + css + js, {
		removeAttributeQuotes: false,
		removeComments: true,
		removeRedundantAttributes: false,
		removeScriptTypeAttributes: false,
		removeStyleLinkTypeAttributes: false,
		sortClassName: true,
		useShortDoctype: true,
		collapseWhitespace: true
	});

	console.log(`Built '${distPath}'`);

	fs.writeFileSync(distPath + '/index.html', final);
}

async function main () {
	await run('webpack --config webpack.config.js');
	if (!fs.existsSync('./webpack_out.js')) {
		console.error('NO WEBPACK OUTPUT!');
		return;
	}
	MAIN = fs.readFileSync('./webpack_out.js');
	fs.unlinkSync('./webpack_out.js');
	await buildHTML('');
}

main();