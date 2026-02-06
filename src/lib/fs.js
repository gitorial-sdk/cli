const fs = require('fs');
const path = require('path');

function ensureDir(dirPath) {
	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, { recursive: true });
	}
}

function removeAllExcept(targetDir, preserveNames = ['.git']) {
	if (!fs.existsSync(targetDir)) {
		return;
	}
	const items = fs.readdirSync(targetDir);
	items.forEach((item) => {
		if (preserveNames.includes(item)) {
			return;
		}
		fs.rmSync(path.join(targetDir, item), { recursive: true, force: true });
	});
}

function copyDir(sourceDir, targetDir, filterFn = () => true) {
	ensureDir(targetDir);
	const items = fs.readdirSync(sourceDir);
	items.forEach((item) => {
		const sourcePath = path.join(sourceDir, item);
		const targetPath = path.join(targetDir, item);
		const stats = fs.statSync(sourcePath);
		if (!filterFn(sourcePath, stats.isDirectory())) {
			return;
		}
		if (stats.isDirectory()) {
			copyDir(sourcePath, targetPath, filterFn);
		} else {
			fs.copyFileSync(sourcePath, targetPath);
		}
	});
}

function listNumericDirs(dirPath) {
	if (!fs.existsSync(dirPath)) {
		return [];
	}
	return fs.readdirSync(dirPath)
		.filter((entry) => /^\d+$/.test(entry))
		.filter((entry) => fs.statSync(path.join(dirPath, entry)).isDirectory())
		.sort((a, b) => parseInt(a) - parseInt(b));
}

function hasNonDocFiles(folderPath) {
	if (!fs.existsSync(folderPath)) {
		return false;
	}

	const entries = fs.readdirSync(folderPath);
	for (const entry of entries) {
		if (entry.startsWith('.')) {
			continue;
		}
		const fullPath = path.join(folderPath, entry);
		const stats = fs.statSync(fullPath);
		if (stats.isDirectory()) {
			if (hasNonDocFiles(fullPath)) {
				return true;
			}
			continue;
		}
		if (entry === 'README.md') {
			continue;
		}
		if (entry.endsWith('.diff')) {
			continue;
		}
		return true;
	}
	return false;
}

function readFirstHeading(markdownPath) {
	if (!fs.existsSync(markdownPath)) {
		return null;
	}
	const content = fs.readFileSync(markdownPath, 'utf8');
	const match = content.match(/^#\s+(.*)/m);
	return match ? match[1].trim() : null;
}

function readGitorialType(markdownPath) {
	if (!fs.existsSync(markdownPath)) {
		return null;
	}
	const content = fs.readFileSync(markdownPath, 'utf8');

	// Hidden HTML comment metadata, safe for included markdown.
	// Example: <!-- gitorial: template -->
	const commentMatch = content.match(/<!--\s*gitorial(?:_type)?\s*:\s*([a-z-]+)\s*-->/i);
	if (commentMatch) {
		return commentMatch[1].toLowerCase();
	}
	return null;
}

module.exports = {
	ensureDir,
	removeAllExcept,
	copyDir,
	listNumericDirs,
	hasNonDocFiles,
	readFirstHeading,
	readGitorialType,
};
