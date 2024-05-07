const simpleGit = require('simple-git');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { GITORIAL_METADATA } = require('./constants');

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

async function unpack(gitPath, outputPath) {
	try {
		// Clone the repository into a new temporary folder
		const tempDir = await fs.mkdtempSync(path.join(os.tmpdir(), 'gitorial-'));
		const git = simpleGit(tempDir);

		// Resolve the full path to the local repository
		const resolvedRepoPath = path.resolve(gitPath);
		await git.clone(resolvedRepoPath, '.', ['--branch', 'master']);

		// Retrieve commit log
		const logs = await git.log();

		// Create a folder for each commit
		// Reverse to make the oldest commit first
		for ([index, log] of logs.all.reverse().entries()) {
			const commitHash = log.hash;
			const commitMessage = log.message;

			let stepFolder = path.join(outputPath, index.toString());

			// Checkout the commit
			console.log(`Checking out commit: ${commitHash}`);
			await git.checkout(commitHash);

			// Copy the contents to the commit folder
			copyFilesAndDirectories(tempDir, stepFolder);
			console.log(`Contents copied from ${tempDir} to ${stepFolder}`);

			// Create a JSON file in the commit folder
			const jsonFilePath = path.join(stepFolder, GITORIAL_METADATA);
			const commitInfoObject = {
				"_Note": "This file will not be included in your final gitorial.",
				commitMessage,
			};

			fs.writeFileSync(jsonFilePath, JSON.stringify(commitInfoObject, null, 2));
		}

		// Clean up source folder
		fs.rmSync(tempDir, { recursive: true });
		console.log("Temporary files removed.");

		console.log("Process completed.");
	} catch (error) {
		console.error('Error:', error.message || error);
	}

}

module.exports = unpack;
