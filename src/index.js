#!/usr/bin/env node

const { program } = require('commander');
const fs = require('fs');
const path = require('path');
const simpleGit = require('simple-git');

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
  .command('repack <inputPath> <outputPath>')
  .description('Create commits from numbered folders')
  .action((inputPath, outputPath) => {
    require('./repack')(inputPath, outputPath);
  });

program.parse(process.argv);
