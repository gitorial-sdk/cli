const simpleGit = require('simple-git');

function createGit(repoPath) {
	return simpleGit(repoPath);
}

async function ensureBranchExists(git, branchName) {
	const branches = await git.branchLocal();
	if (!branches.all.includes(branchName)) {
		throw new Error(`Branch not found: ${branchName}`);
	}
}

async function checkoutBranch(git, branchName) {
	await git.checkout(branchName);
}

async function deleteBranchIfExists(git, branchName) {
	const branches = await git.branchLocal();
	if (branches.all.includes(branchName)) {
		await git.raw(['branch', '-D', branchName]);
	}
}

async function createOrphanBranch(git, branchName, { force, fromBranch }) {
	if (fromBranch) {
		await checkoutBranch(git, fromBranch);
	}
	if (force) {
		await deleteBranchIfExists(git, branchName);
	} else {
		const branches = await git.branchLocal();
		if (branches.all.includes(branchName)) {
			throw new Error(`Branch already exists: ${branchName}`);
		}
	}
	await git.raw(['switch', '--orphan', branchName]);
}

module.exports = {
	createGit,
	ensureBranchExists,
	checkoutBranch,
	createOrphanBranch,
};
