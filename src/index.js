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
	.action(({ path, inputBranch, outputBranch, subFolder }) => {
		require('./repack')(path, inputBranch, outputBranch, subFolder);
	});

// Command to create an mdBook from a Gitorial.
program
	.command('mdbook <gitorialPath> <gitorialBranch> <mdbookBranch>')
	.description('Create an mdBook from a Gitorial source.')
	.action((gitorialPath, gitorialBranch, mdbookBranch) => {
		require('./mdbook')(gitorialPath, gitorialBranch, mdbookBranch);
	});

program.parse(process.argv);
