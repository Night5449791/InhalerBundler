const fs = require('fs');

module.exports = {
	VARS: {
		IS_DEV: false,
		DEST_PATH: ''
	},
	makePath(path) {
		if (!fs.existsSync(path)) {
			fs.mkdirSync(path);
		}
	},
	// dev lua never reaches a production build, obsidian included
	isDevFile(name) {
		return name.includes('- dev') || name.endsWith('dev.lua');
	}
};