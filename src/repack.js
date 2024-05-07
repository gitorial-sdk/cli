const simpleGit = require('simple-git');
const fs = require('fs');
const path = require('path');
const { GITORIAL_METADATA } = require('./constants');

function copyAllContentsAndReplace(sourceDir, targetDir) {
	// Create target directory if it doesn't exist
	if (!fs.existsSync(targetDir)) {
		fs.mkdirSync(targetDir, { recursive: true });
	}

	// Get list of items in source directory
	const items = fs.readdirSync(sourceDir);

	// Copy each item to target directory and replace existing items
	items.forEach(item => {
		const sourcePath = path.join(sourceDir, item);
		const targetPath = path.join(targetDir, item);
		if (fs.statSync(sourcePath).isDirectory()) {
			if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
				fs.rmSync(targetPath, { recursive: true }); // Remove existing directory
			}
			fs.mkdirSync(targetPath, { recursive: true }); // Create directory in target
			copyAllContentsAndReplace(sourcePath, targetPath); // Recursively copy contents of directory
		} else {
			if (fs.existsSync(targetPath)) {
				fs.unlinkSync(targetPath); // Delete existing file
			}
			fs.copyFileSync(sourcePath, targetPath); // Copy file
		}
	});
}

async function repack(inputPath, repoPath, branchName) {
	try {
		const git = simpleGit(repoPath);
		await git.raw(['switch', '--orphan', branchName]);

		// Get list of commits
		const commits = fs.readdirSync(inputPath)
			.filter(item => fs.statSync(path.join(inputPath, item)).isDirectory())
			.sort((a, b) => parseInt(a) - parseInt(b)); // Sort folders numerically

		for (const commit of commits) {
			const commitFolderPath = path.join(inputPath, commit);

			// Read commit message from GITORIAL_METADATA
			const commitInfoPath = path.join(commitFolderPath, GITORIAL_METADATA);
			const commitInfo = JSON.parse(fs.readFileSync(commitInfoPath, 'utf-8'));
			const commitMessage = commitInfo.commitMessage;

			console.log(commitMessage);

			// Copy files from numbered folder to repo path
			copyAllContentsAndReplace(commitFolderPath, repoPath);

			// Stage all files
			await git.add('*');

			// Remove GITORIAL_METADATA
			await git.reset(GITORIAL_METADATA);
			await git.rm(GITORIAL_METADATA);

			// Create commit with commit message
			await git.commit(commitMessage);

			console.log(`Commit created for folder ${commit} with message: ${commitMessage}`);
		}

		console.log('Commits created successfully.')

	} catch (error) {
		console.error('Error:', error.message || error);
	}
}

module.exports = repack;
