const simpleGit = require('simple-git');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { GITORIAL_METADATA } = require('./constants');
const { copyAllContentsAndReplace, doesBranchExist } = require('./utils')

function copyFilesAndDirectories(source, target) {
	// Check if source exists
	if (!fs.existsSync(source)) {
		console.error(`Source directory ${source} does not exist.`);
		return;
	}

	// Create target directory if it doesn't exist
	if (!fs.existsSync(target)) {
		fs.mkdirSync(target, { recursive: true });
	}

	// Get list of items in source directory
	const items = fs.readdirSync(source);

	// Copy each item to target directory
	items.forEach(item => {
		// Skip .git folder
		if (item === '.git') {
			return;
		}

		const sourcePath = path.join(source, item);
		const targetPath = path.join(target, item);
		if (fs.statSync(sourcePath).isDirectory()) {
			// Recursively copy directories
			copyFilesAndDirectories(sourcePath, targetPath);
		} else {
			// Copy files
			fs.copyFileSync(sourcePath, targetPath);
		}
	});
}

async function unpack(gitPath, inputBranch, outputBranch) {
	try {
		// Create a new temporary folder
		const sourceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gitorial-source-'));
		const unpackedDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gitorial-unpacked-'));

		// Clone the repo into the source folder.
		const tempGit = simpleGit(sourceDir);

		// Resolve the full path to the local repository
		const resolvedRepoPath = path.resolve(gitPath);
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

		let sourceGit = simpleGit(gitPath);

		// Check if the branch exists in the list of local branches
		const branchExists = await doesBranchExist(sourceGit, outputBranch)

		if (!branchExists) {
			// Create a fresh branch if it does not exist.
			await sourceGit.raw(['switch', '--orphan', outputBranch]);
		} else {
			// Checkout the current branch if it does.
			await sourceGit.checkout(outputBranch)
		}
		copyAllContentsAndReplace(unpackedDir, gitPath);

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
