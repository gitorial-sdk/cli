#!/usr/bin/env node

const { program } = require('commander');

program
	.version('1.0.0')
	.description('Node.js CLI application to manage Git repositories');

// Command to organize commits into numbered folders
program
	.command('unpack <inputPath> <outputPath>')
	.description('Unpack commits of a repo into numbered folders.')
	.action((inputPath, outputPath) => {
		require('./unpack')(inputPath, outputPath);
	});

// Command to create commits from numbered folders
program
	.command('repack <inputPath> <repoPath> <branchName>')
	.description('Create commits from numbered folders')
	.action((inputPath, repoPath, branchName) => {
		require('./repack')(inputPath, repoPath, branchName);
	});

program.parse(process.argv);
