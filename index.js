const fs = require('fs');
const path = require('node:path');
const processGame = require('./helpers/processGame.js');
const processUI = require('./helpers/processUI.js');
const {
	SRC_PATH,
	DEV_PATH,
	PROD_PATH,
	// obsidian repositories are optional, the defaults match this workspace
	OBSIDIAN_SRC_PATH = '../InhalerObsidian',
	OBSIDIAN_PATH = './InhalerObsidianCompiled'
} = require('./config.json');
const { VARS, makePath, isDevFile } = require('./helpers/vars.js');
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

function copyFolder(from, to) {
	if (!fs.existsSync(from)) return 0;

	let copied = 0;
	for (const file of fs.readdirSync(from)) {
		if (isDevFile(file)) {
			console.log('\x1b[36m[*] Skipped ' + file + ' (dev)\x1b[0m');
			continue;
		}

		fs.copyFileSync(path.join(from, file), path.join(to, file));
		copied++;
	}

	return copied;
}

// obsidian build: production lua only, so shared/dev variants are never written out
function buildObsidian(buildMain, buildGames) {
	console.log('\x1b[33mInhaler Obsidian Bundler Started!\x1b[0m');

	const timeTaken = Date.now();
	VARS.IS_DEV = false;
	VARS.DEST_PATH = OBSIDIAN_PATH;

	for (const basePath of [
		OBSIDIAN_PATH,
		path.join(OBSIDIAN_PATH, 'libraries'),
		path.join(OBSIDIAN_PATH, 'games'),
		path.join(OBSIDIAN_PATH, 'guis')
	]) {
		makePath(basePath);
	}

	if (buildMain) {
		console.log('\x1b[36m[*] Copying main files...\x1b[0m');
		for (const file of ['loader.lua', 'main.lua']) {
			const source = path.join(OBSIDIAN_SRC_PATH, file);
			if (fs.existsSync(source)) {
				fs.copyFileSync(source, path.join(OBSIDIAN_PATH, file));
			}
		}

		console.log('\x1b[36m[*] Copying libraries...\x1b[0m');
		copyFolder(path.join(OBSIDIAN_SRC_PATH, 'libraries'), path.join(OBSIDIAN_PATH, 'libraries'));

		console.log('\x1b[36m[*] Copying guis...\x1b[0m');
		copyFolder(path.join(OBSIDIAN_SRC_PATH, 'guis'), path.join(OBSIDIAN_PATH, 'guis'));
	}

	if (buildGames) {
		console.log('\x1b[36m[*] Building obsidian games...\x1b[0m');
		const GAMES_PATH = path.join(OBSIDIAN_SRC_PATH, 'games');

		if (fs.existsSync(GAMES_PATH)) {
			for (const game of fs.readdirSync(GAMES_PATH)) {
				if (isDevFile(game)) {
					console.log('\x1b[36m[*] Skipped ' + game + ' (dev)\x1b[0m');
					continue;
				}

				const fullPath = path.join(GAMES_PATH, game);
				if (fs.statSync(fullPath).isDirectory()) {
					processGame(fullPath, game);
				} else if (game.endsWith('.lua')) {
					fs.copyFileSync(fullPath, path.join(OBSIDIAN_PATH, 'games', game));
				}
			}
		}
	}

	console.log('\x1b[32m[*] Finished obsidian bundling in ' + (Date.now() - timeTaken) + 'ms \x1b[0m');
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
		.command(
			'obsidian',
			new Command()
				.description('Build InhalerObsidian with production lua only')
				.action((args) => buildObsidian(args.mode == 'full' || args.mode == 'main', args.mode == 'full' || args.mode == 'games'))
		)
		.parse();
})();
