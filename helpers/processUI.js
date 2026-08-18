const fs = require('fs');
const path = require('node:path');
const { VARS, makePath } = require('./vars.js');

module.exports = function(GUI_PATH, name) {
	const timeTaken = Date.now();
	const components = [], libraries = [], overlays = [];
	const DEST_PATH = VARS.DEST_PATH;
	const ASSET_PATH = path.join(GUI_PATH, 'assets');
	const COMPONENT_PATH = path.join(GUI_PATH, 'components');
	const LIBRARY_PATH = path.join(GUI_PATH, 'libraries');
	const OVERLAY_PATH = path.join(GUI_PATH, 'overlays');
	makePath(path.join(DEST_PATH, 'assets', name));

	for (const asset of fs.readdirSync(ASSET_PATH)) {
		fs.copyFileSync(path.join(ASSET_PATH, asset), path.join(DEST_PATH, 'assets', name, asset));
	}

	if (fs.existsSync(LIBRARY_PATH)) {
		for (const library of fs.readdirSync(LIBRARY_PATH)) {
			libraries.push({
				name: library.substring(0, library.length - 4),
				data: fs.readFileSync(path.join(LIBRARY_PATH, library), {encoding: 'utf8'})
			});
		}
	}

	if (fs.existsSync(OVERLAY_PATH)) {
		for (const overlay of fs.readdirSync(OVERLAY_PATH)) {
			overlays.push({
				name: overlay.substring(0, overlay.length - 4),
				data: fs.readFileSync(path.join(OVERLAY_PATH, overlay), {encoding: 'utf8'})
			});
		}
	}

	if (fs.existsSync(COMPONENT_PATH)) {
		for (const component of fs.readdirSync(COMPONENT_PATH)) {
			const cname = component.substring(0, component.length - 4);
			let data = fs.readFileSync(path.join(COMPONENT_PATH, component), {encoding: 'utf8'});
			data = data.split('\n').map((line) => '\t\t' + line).join('\n');

			components.push({
				name: cname,
				data
			});
		}
	}

	libraries.sort((a, b) => a.name.localeCompare(b.name));
	overlays.sort((b, a) => a.name.localeCompare(b.name));
	components.sort((a, b) => a.name.localeCompare(b.name));
	let initData = fs.readFileSync(path.join(GUI_PATH, 'init.lua'), {encoding: 'utf8'});
	let baseData = fs.readFileSync(path.join(GUI_PATH, 'base.lua'), {encoding: 'utf8'});

	initData = initData.replace('--Overlays', `${overlays.map((data) => {
		return 'run(function()\n' + data.data.split('\n').map((line) => '\t' + line).join('\n') + '\nend)';
	}).join('\n\n')}`);

	initData = initData.split('\n').map((line) => '\t' + line).join('\n');

	baseData = baseData.replace('--Libraries', `${libraries.map((data) => {
		return data.data;
	}).join('\n\n')}\n\nvape.Libraries = {\n${libraries.map(data => {
		return '\t' + data.name + ' = ' + data.name + ',';
	}).join('\n')}\n}`);

	baseData = baseData.replace('--Components', `components = {\n${components.map((data) => {
		return '\t' + data.name + ' = function(props, children, api)\n' + data.data + '\n\tend,';
	}).join('\n')}\n}`);

	baseData = baseData.replace('--Init', initData);

	fs.writeFileSync(path.join(DEST_PATH, 'guis', name + '.lua'), baseData);

	console.log('\x1b[36m[*] Built guis/' + name + '.lua in ' + (Date.now() - timeTaken) + 'ms \x1b[0m');
};