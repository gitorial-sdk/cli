const simpleGit = require('simple-git');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { GITORIAL_METADATA } = require('./constants');
const { copyAllContentsAndReplace } = require('./utils')

async function repack(repoPath, inputBranch, outputBranch, subFolder, force) {
	try {
		const git = simpleGit(repoPath);

		if (force) {
			try {
				await git.raw(['branch', '-D', outputBranch]);
			} catch {
				// ignore if the branch cannot be deleted
			}
			await git.raw(['switch', '--orphan', outputBranch]);
		} else {
			await git.raw(['switch', '--orphan', outputBranch]);
		}

		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gitorial-repack-'));
		await git.clone(repoPath, tempDir, ['--branch', inputBranch]);

		let unpackedDir = tempDir;
		if (subFolder) {
			unpackedDir = path.join(unpackedDir, subFolder)
		}

		// Get list of steps
		const steps = fs.readdirSync(unpackedDir)
			.filter(item => fs.statSync(path.join(unpackedDir, item)).isDirectory())
			.filter(item => item != '.git') // skip the git directory
			.sort((a, b) => parseInt(a) - parseInt(b)); // Sort folders numerically

		for (const step of steps) {
			const stepFolderPath = path.join(unpackedDir, step);

			// Read commit message from GITORIAL_METADATA
			const commitInfoPath = path.join(stepFolderPath, GITORIAL_METADATA);
			const commitInfo = JSON.parse(fs.readFileSync(commitInfoPath, 'utf-8'));
			const commitMessage = commitInfo.commitMessage;

			// Copy files from numbered folder to repo path
			copyAllContentsAndReplace(stepFolderPath, repoPath);

			// Stage all files
			await git.add('*');

			// Remove GITORIAL_METADATA
			await git.reset(GITORIAL_METADATA);
			await git.rm(GITORIAL_METADATA);

			// Create commit with commit message
			await git.commit(commitMessage);

			console.log(`Commit created for step ${step} with message: ${commitMessage}`);
		}

		// Clean up temp folder
		fs.rmSync(tempDir, { recursive: true });
		console.log("Temporary files removed.");

		console.log('Commits created successfully.')

	} catch (error) {
		console.error('Error:', error.message || error);
	}
}

module.exports = repack;
