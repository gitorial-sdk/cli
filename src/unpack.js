const simpleGit = require('simple-git');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { GITORIAL_METADATA } = require('./constants');
const { copyAllContentsAndReplace, doesBranchExist, copyFilesAndDirectories } = require('./utils')

async function unpack(repoPath, inputBranch, outputBranch, outputSubFolder) {
	try {
		// Create a new temporary folder
		const sourceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gitorial-source-'));
		const unpackedDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gitorial-unpacked-'));

		// Clone the repo into the source folder.
		const tempGit = simpleGit(sourceDir);

		// Resolve the full path to the local repository
		const resolvedRepoPath = path.resolve(repoPath);
		await tempGit.clone(resolvedRepoPath, '.', ['--branch', inputBranch]);

		// Retrieve commit log
		const logs = await tempGit.log();

		// Create a folder for each commit
		// Reverse to make the oldest commit first
		for ([index, log] of logs.all.reverse().entries()) {
			const commitHash = log.hash;
			const commitMessage = log.message;

			let stepFolder = path.join(unpackedDir, index.toString());

			// Checkout the commit
			console.log(`Checking out commit: ${commitHash}`);
			await tempGit.checkout(commitHash);

			// Copy the contents to the commit folder
			copyFilesAndDirectories(sourceDir, stepFolder);
			console.log(`Contents copied from ${sourceDir} to ${stepFolder}`);

			// Create a JSON file in the commit folder
			const jsonFilePath = path.join(stepFolder, GITORIAL_METADATA);
			const commitInfoObject = {
				"_Note": "This file will not be included in your final gitorial.",
				commitMessage,
			};

			fs.writeFileSync(jsonFilePath, JSON.stringify(commitInfoObject, null, 2));
		}

		let sourceGit = simpleGit(repoPath);

		// Check if the branch exists in the list of local branches
		const branchExists = await doesBranchExist(sourceGit, outputBranch)

		if (!branchExists) {
			// Create a fresh branch if it does not exist.
			await sourceGit.raw(['switch', '--orphan', outputBranch]);
		} else {
			// Checkout the current branch if it does.
			await sourceGit.checkout(outputBranch)
		}

		let outputFolder = repoPath;
		if (outputSubFolder) {
			outputFolder = path.join(repoPath, outputSubFolder)
		}

		copyAllContentsAndReplace(unpackedDir, outputFolder);

		// Stage all files
		await sourceGit.add('*');

		// Create commit with commit message
		await sourceGit.commit(`Unpacked from ${inputBranch}`);

		// Clean up source folder
		fs.rmSync(sourceDir, { recursive: true });
		fs.rmSync(unpackedDir, { recursive: true });
		console.log("Temporary files removed.");

		console.log("Process completed.");
	} catch (error) {
		console.error('Error:', error.message || error);
	}

}

module.exports = unpack;
