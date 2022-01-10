const { exec } = require("child_process");
/**
 * @param {string} cmd
 * @returns {Promise<void>}
 */
exports.run = async (cmd) => {
	return new Promise((e) => {
		exec(cmd, (error, stdout, stderr) => {
			if (error) throw error;
			if (stdout) console.error(stdout);
			if (stderr) console.error(stderr);
			e();
		});
	});
}