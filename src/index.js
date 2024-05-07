#!/usr/bin/env node

const { program } = require('commander');

program
	.version('1.0.0')
	.description('Node.js CLI application to manage Git repositories');

// Command to organize commits into numbered folders
program
	.command('unpack <gitorialPath> <gitorialBranch> <unpackedBranch>')
	.description('Unpack commits of a gitorial branch into numbered folders in another branch.')
	.action((gitorialPath, gitorialBranch, unpackedBranch) => {
		require('./unpack')(gitorialPath, gitorialBranch, unpackedBranch);
	});

// Command to create commits from numbered folders
program
	.command('repack <gitorialPath> <unpackedBranch> <repackBranch>')
	.description('Create commits from numbered folders. Must repack into a new branch.')
	.action((inputPath, repoPath, branchName) => {
		require('./repack')(inputPath, repoPath, branchName);
	});

program.parse(process.argv);
