const fs = require('fs');
const path = require('path');

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

function clearWorkingTree(targetDir, preserveNames = ['.git']) {
	if (!fs.existsSync(targetDir)) {
		return;
	}

	const items = fs.readdirSync(targetDir);
	items.forEach(item => {
		if (preserveNames.includes(item)) {
			return;
		}
		fs.rmSync(path.join(targetDir, item), { recursive: true, force: true });
	});
}

function copyDirectoryWithFilter(sourceDir, targetDir, shouldSkip) {
	// Create target directory if it doesn't exist
	if (!fs.existsSync(targetDir)) {
		fs.mkdirSync(targetDir, { recursive: true });
	}

	const items = fs.readdirSync(sourceDir);
	items.forEach(item => {
		const sourcePath = path.join(sourceDir, item);
		const targetPath = path.join(targetDir, item);
		const isDirectory = fs.statSync(sourcePath).isDirectory();
		if (shouldSkip(sourcePath, isDirectory)) {
			return;
		}
		if (isDirectory) {
			fs.mkdirSync(targetPath, { recursive: true });
			copyDirectoryWithFilter(sourcePath, targetPath, shouldSkip);
		} else {
			fs.copyFileSync(sourcePath, targetPath);
		}
	});
}

async function doesBranchExist(git, branchName) {
	try {
		// Get a list of all local branches
		const branches = await git.branchLocal();
		// Check if the branch exists in the list of local branches
		const branchExists = branches.all.includes(branchName);
		return branchExists;
	} catch (error) {
		console.error('Error checking if branch exists:', error);
		return false;
	}
}

module.exports = {
	copyAllContentsAndReplace,
	clearWorkingTree,
	copyDirectoryWithFilter,
	doesBranchExist,
	copyFilesAndDirectories
};
