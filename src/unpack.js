const simpleGit = require('simple-git');
const fs = require('fs');
const path = require('path');
const { COMMIT_INFO, TEMP_FOLDER } = require('./constants');

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
		// Clone the repository into a new folder
		const git_init = simpleGit();
		const tempDir = path.join(outputPath, TEMP_FOLDER);
		await git_init.clone(gitPath, tempDir, ['--branch', 'master']);

		const git = simpleGit(tempDir);

		// Retrieve commit log
		const logs = await git.log();


		let stepCounter = 0;

		// Create a folder for each commit
		// Reverse to make the oldest commit first
		for ([index, log] of logs.all.reverse().entries()) {
			const commitHash = log.hash;
			const commitMessage = log.message;

			let stepFolder = path.join(outputPath, stepCounter.toString());
			if (!fs.existsSync(stepFolder)) {
				fs.mkdirSync(stepFolder);
			}

			// Checkout the commit
			console.log(`Checking out commit: ${commitHash}`);
			await git.checkout(commitHash);

			// Copy the contents to the commit folder
			copyFilesAndDirectories(tempDir, stepFolder);
			console.log(`Contents copied from ${tempDir} to ${stepFolder}`);

			// Create a JSON file in the commit folder
			const jsonFilePath = path.join(stepFolder, COMMIT_INFO);
			const commitInfoObject = {
				"_Note": "This file will not be included in your final gitorial.",
				commitMessage,
			};

			fs.writeFileSync(jsonFilePath, JSON.stringify(commitInfoObject, null, 2));


			stepCounter += 1;
		}

		// Clean up source folder
		fs.rmSync(tempDir, { recursive: true, force: true });

		console.log("Process completed.");
	} catch (error) {
		console.error('Error:', error.message || error);
	}

}

module.exports = unpack;
