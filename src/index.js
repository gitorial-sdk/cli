#!/usr/bin/env node

const { program } = require('commander');
const { buildGitorial } = require('./commands/build-gitorial');
const { buildMdbook } = require('./commands/build-mdbook');
const { installWorkflows } = require('./commands/install-workflows');
const { version } = require('../package.json');

program
	.name('gitorial-cli')
	.description('CLI tools for building and maintaining Gitorial tutorials')
	.version(version);

program
	.command('build-gitorial')
	.description('Generate a gitorial branch from an mdBook workshop branch')
	.option('-r, --repo <path>', 'Path to the tutorial repo', process.cwd())
	.option('-i, --input <branch>', 'Input workshop branch', 'master')
	.option('-o, --output <branch>', 'Output gitorial branch', 'gitorial')
	.option('-s, --source <dir>', 'mdBook source directory', 'src')
	.option('--force', 'Replace output branch if it exists', false)
	.option('--verbose', 'Verbose logging', false)
	.action(async (options) => {
		await buildGitorial(options);
	});

program
	.command('build-mdbook')
	.description('Generate an mdBook workshop branch from a gitorial branch')
	.option('-r, --repo <path>', 'Path to the tutorial repo', process.cwd())
	.option('-i, --input <branch>', 'Input gitorial branch', 'gitorial')
	.option('-o, --output <branch>', 'Output workshop branch', 'master')
	.option('-s, --source <dir>', 'mdBook source directory', 'src')
	.option('--force', 'Replace output branch if it exists', false)
	.option('--verbose', 'Verbose logging', false)
	.action(async (options) => {
		await buildMdbook(options);
	});

program
	.command('install-workflows')
	.description('Install CI workflows (check, deploy, gitorial-sync) into a tutorial repo')
	.option('-r, --repo <path>', 'Path to the tutorial repo', process.cwd())
	.option('-i, --input <branch>', 'mdBook/workshop branch', 'master')
	.option('-o, --output <branch>', 'Gitorial branch', 'gitorial')
	.option('-s, --source <dir>', 'mdBook source directory', 'src')
	.option('--force', 'Overwrite existing workflow files', false)
	.option('--commit', 'Commit generated workflow files', false)
	.option('--verbose', 'Verbose logging', false)
	.action(async (options) => {
		await installWorkflows(options);
	});

program.parseAsync(process.argv).catch((error) => {
	console.error(error.message || error);
	process.exitCode = 1;
});
