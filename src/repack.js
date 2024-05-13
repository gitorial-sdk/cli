const simpleGit = require('simple-git');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { GITORIAL_METADATA } = require('./constants');
const { copyAllContentsAndReplace } = require('./utils')

async function repack(repoPath, unpackedBranch, repackedBranch) {
	try {
		const git = simpleGit(repoPath);
		await git.raw(['switch', '--orphan', repackedBranch]);

		const unpackedDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gitorial-repack-'));
		await git.clone(repoPath, unpackedDir, ['--branch', unpackedBranch]);

		// Get list of commits
		const commits = fs.readdirSync(unpackedDir)
			.filter(item => fs.statSync(path.join(unpackedDir, item)).isDirectory())
			.filter(item => item != '.git') // skip the git directory
			.sort((a, b) => parseInt(a) - parseInt(b)); // Sort folders numerically

		for (const commit of commits) {
			const commitFolderPath = path.join(unpackedDir, commit);

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

		// Clean up temp folder
		fs.rmSync(unpackedDir, { recursive: true });
		console.log("Temporary files removed.");

		console.log('Commits created successfully.')

	} catch (error) {
		console.error('Error:', error.message || error);
	}
}

module.exports = repack;
