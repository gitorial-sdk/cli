#!/usr/bin/env node

const { program } = require('commander');

program
	.version('1.0.0')
	.description('Node.js CLI application to manage Git repositories');

// Command to unpack a Gitorial into another branch.
program
	.command('unpack')
	.description('Unpack a Gitorial into another branch.')
	.requiredOption('-p, --path <path>', 'The local path for the git repo containing the Gitorial.')
	.requiredOption('-i, --inputBranch <inputBranch>', 'The branch in the repo with the Gitorial.')
	.requiredOption('-o, --outputBranch <outputBranch>', 'The branch where you want to unpack the Gitorial.')
	.option('-s, --subFolder <subFolder>', 'The subfolder (relative to the <path>) where you want the unpacked Gitorial to be placed.')
	.action(({ path, inputBranch, outputBranch, subFolder }) => {
		require('./unpack')(path, inputBranch, outputBranch, subFolder);
	});


// Command to create a repacked Gitorial from an unpacked Gitorial.
program
	.command('repack')
	.description('Create a repacked Gitorial from an unpacked Gitorial. Must repack into a new branch.')
	.requiredOption('-p, --path <path>', 'The local path for the git repo containing the Gitorial.')
	.requiredOption('-i, --inputBranch <inputBranch>', 'The branch in the repo with the unpacked Gitorial.')
	.requiredOption('-o, --outputBranch <outputBranch>', 'The branch where you want to repack the Gitorial. Branch must not exist.')
	.option('-s, --subFolder <subFolder>', 'The subfolder (relative to the <path>) where you can find the unpacked Gitorial')
	.option('--force', 'Force the repack, even if it would replace an existing branch. WARNING: this can delete the branch history!')
	.action(({ path, inputBranch, outputBranch, subFolder, force }) => {
		require('./repack')(path, inputBranch, outputBranch, subFolder, force);
	});

// Command to scaffold an mdBook source from a Gitorial.
program
	.command('mdbook')
	.description('Scaffold the contents of a Gitorial in a new branch in the mdBook source format. You need to initialize an mdBook yourself ')
	.requiredOption('-p, --path <path>', 'The local path for the git repo containing the Gitorial.')
	.requiredOption('-i, --inputBranch <inputBranch>', 'The branch in the repo with the Gitorial.')
	.requiredOption('-o, --outputBranch <outputBranch>', 'The branch where you want your mdBook to live')
	.option('-s, --subFolder <subFolder>', 'The subfolder (relative to the <path>) where you want the mdBook source material to be placed.', 'src')
	.action(({ path, inputBranch, outputBranch, subFolder }) => {
		require('./mdbook')(path, inputBranch, outputBranch, subFolder);
	});

program.parse(process.argv);
