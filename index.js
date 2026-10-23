const fs = require('fs');
const path = require('node:path');
const processGame = require('./helpers/processGame.js');
const processUI = require('./helpers/processUI.js');
const { SRC_PATH, DEV_PATH, PROD_PATH } = require('./config.json');
const { VARS, makePath } = require('./helpers/vars.js');
const { Command } = require('@cliffy/command');

function main(isDev, buildMain, buildGames) {
	console.log('\x1b[33mInhaler Bundler Started!\x1b[0m');

	const timeTaken = Date.now();
	const DEST_PATH = isDev ? DEV_PATH : PROD_PATH;
	VARS.IS_DEV = isDev;
	VARS.DEST_PATH = DEST_PATH;

	// create folders
	for (const basePath of [
		DEST_PATH,
		path.join(DEST_PATH, 'assets'),
		path.join(DEST_PATH, 'libraries'),
		path.join(DEST_PATH, 'games'),
		path.join(DEST_PATH, 'guis')
	]) {
		makePath(basePath);
	}

	// build main files, libraries, and gui libraries
	if (buildMain) {
		console.log('\x1b[36m[*] Copying main files...\x1b[0m');
		fs.copyFileSync(path.join(SRC_PATH, 'loader.lua'), path.join(DEST_PATH, 'loader.lua'));
		fs.copyFileSync(path.join(SRC_PATH, 'main.lua'), path.join(DEST_PATH, 'main.lua'));

		console.log('\x1b[36m[*] Copying libraries...\x1b[0m');
		const LIBRARY_PATH = path.join(SRC_PATH, 'libraries');
		for (const library of fs.readdirSync(LIBRARY_PATH)) {
			fs.copyFileSync(path.join(LIBRARY_PATH, library), path.join(DEST_PATH, 'libraries', library));
		}

		console.log('\x1b[36m[*] Building UI libraries...\x1b[0m');
		const GUI_PATH = path.join(SRC_PATH, 'guis');
		for (const gui of fs.readdirSync(GUI_PATH)) {
			processUI(path.join(GUI_PATH, gui), gui);
		}
	}

	// build all game files
	if (buildGames) {
		console.log('\x1b[36m[*] Building games...\x1b[0m');
		const GAMES_PATH = path.join(SRC_PATH, 'games');
		for (const game of fs.readdirSync(GAMES_PATH)) {
			if (game.includes('-')) {
				processGame(path.join(GAMES_PATH, game), game);
			} else {
				const basePath = path.join(GAMES_PATH, game);
				for (const extra of fs.readdirSync(basePath)) {
					processGame(path.join(basePath, extra), extra);
				}
			}
		}
	}

	console.log('\x1b[32m[*] Finished bundling all files in ' + (Date.now() - timeTaken) + 'ms \x1b[0m');
}

(async function() {
	await new Command()
		.name('Main')
		.description('Basic bundler dedicated for vape')
		.globalOption('--mode [mode:string]', 'full, main, games', {default: 'full'})
		.command(
			'prod',
			new Command()
				.description('Build with production')
				.action((args) => main(false, args.mode == 'full' || args.mode == 'main', args.mode == 'full' || args.mode == 'games'))
		)
		.command(
			'dev',
			new Command()
				.description('Build with developer extras')
				.action((args) => main(true, args.mode == 'full' || args.mode == 'main', args.mode == 'full' || args.mode == 'games'))
		)
		.parse();
})();
