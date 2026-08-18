const fs = require('fs');
const path = require('node:path');
const { VARS } = require('./vars.js');
const categories = ['Combat', 'Blatant', 'Render', 'Utility', 'World', 'Inventory', 'Legit'];

module.exports = function(basePath, name) {
	const timeTaken = Date.now();
	const args = name.split(' - ');
	const DEST_PATH = VARS.DEST_PATH;
	const IS_DEV = VARS.IS_DEV;

	if (!IS_DEV && (args[2] == 'dev' || args[2] == 'dev.lua')) {
		console.log('\x1b[36m[*] Skipped ' + args[0] + '.lua \x1b[0m');
		return;
	}

	if (!name.endsWith('.lua')) {
		let baseData = fs.readFileSync(path.join(basePath, 'base.lua'), {encoding: 'utf8'});
		const appendData = [''];

		for (let category of categories) {
			category = path.join(basePath, category);

			if (fs.existsSync(category)) {
				let files = fs.readdirSync(category);
				files.sort((a, b) => a.localeCompare(b));

				if (!IS_DEV) {
					files = files.filter((file) => !file.includes('- dev'));
				}

				for (const file of files) {
					const data = fs.readFileSync(path.join(category, file), {encoding: 'utf8'});

					if (!data.includes('run\(')) {
						const split = data.split('\n').map((line) => '\t' + line);
						split.unshift('run(function()');
						split.push('end)');
						appendData.push(split.join('\n'));
					} else {
						appendData.push(data);
					}
				}
			}
		}

		fs.writeFileSync(path.join(DEST_PATH, 'games', args[0] + '.lua'), baseData + appendData.join('\n\n'));
		console.log('\x1b[36m[*] Built ' + args[0] + '.lua in ' + (Date.now() - timeTaken) + 'ms \x1b[0m');
	} else {
		fs.copyFileSync(basePath, path.join(DEST_PATH, 'games', args[0] + '.lua'));
		console.log('\x1b[36m[*] Built ' + args[0] + '.lua in ' + (Date.now() - timeTaken) + 'ms \x1b[0m');
	}
};