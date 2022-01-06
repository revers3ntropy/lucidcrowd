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