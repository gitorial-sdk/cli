const simpleGit = require('simple-git');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
	clearWorkingTree,
	copyDirectoryWithFilter,
	doesBranchExist
} = require('./utils');

function readFirstHeading(markdownPath) {
	if (!fs.existsSync(markdownPath)) {
		return null;
	}
	const markdownContent = fs.readFileSync(markdownPath, 'utf8');
	const titleMatch = markdownContent.match(/^#\s+(.*)/m);
	return titleMatch ? titleMatch[1].trim() : null;
}

function getStepTitle(stepDir) {
	const candidates = [
		path.join(stepDir, 'template', 'README.md'),
		path.join(stepDir, 'source', 'README.md'),
		path.join(stepDir, 'solution', 'README.md'),
		path.join(stepDir, 'README.md')
	];
	for (const candidate of candidates) {
		const title = readFirstHeading(candidate);
		if (title) {
			return title;
		}
	}
	return path.basename(stepDir);
}

function shouldSkipFile(sourcePath, isDirectory) {
	const baseName = path.basename(sourcePath);
	if (baseName === '.git') {
		return true;
	}
	if (!isDirectory && baseName.endsWith('.diff')) {
		return true;
	}
	return false;
}

function folderHasNonDocFiles(folderPath) {
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
			if (folderHasNonDocFiles(fullPath)) {
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

function copySnapshot(sourceDir, repoPath) {
	clearWorkingTree(repoPath, ['.git']);
	copyDirectoryWithFilter(sourceDir, repoPath, shouldSkipFile);
}

async function repackMdbook(repoPath, inputBranch, outputBranch, subFolder, force) {
	try {
		const git = simpleGit(repoPath);

		const branchExists = await doesBranchExist(git, outputBranch);
		if (branchExists) {
			if (!force) {
				console.error(`Branch ${outputBranch} already exists. Use --force to replace it.`);
				process.exit(1);
			}
			const saveBranch = `${outputBranch}-__gitorial-old`;
			try {
				await git.raw(['branch', '-D', saveBranch]);
			} catch (error) {
				// Ignore the error if the branch does not exist
			}
			try {
				await git.branch(['-m', outputBranch, saveBranch]);
			} catch (error) {
				// Ignore the error if the branch does not exist
			}
		}

		await git.raw(['switch', '--orphan', outputBranch]);

		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gitorial-repack-mdbook-'));
		await git.clone(repoPath, tempDir, ['--branch', inputBranch]);

		let mdbookDir = tempDir;
		if (subFolder) {
			mdbookDir = path.join(mdbookDir, subFolder);
		}

		const steps = fs.readdirSync(mdbookDir)
			.filter(item => fs.statSync(path.join(mdbookDir, item)).isDirectory())
			.filter(item => item !== '.git')
			.filter(item => /^\d+$/.test(item))
			.sort((a, b) => parseInt(a) - parseInt(b));

		for (const [index, step] of steps.entries()) {
			const stepFolderPath = path.join(mdbookDir, step);
			const stepTitle = getStepTitle(stepFolderPath);

			const templateDir = path.join(stepFolderPath, 'template');
			const solutionDir = path.join(stepFolderPath, 'solution');
			const sourceDir = path.join(stepFolderPath, 'source');

			const hasTemplate = fs.existsSync(templateDir);
			const hasSolution = fs.existsSync(solutionDir);
			const hasSource = fs.existsSync(sourceDir);

			if (hasTemplate && hasSolution) {
				copySnapshot(templateDir, repoPath);
				await git.add('*');
				await git.commit(`template: ${stepTitle}`);

				copySnapshot(solutionDir, repoPath);
				await git.add('*');
				await git.commit(`solution: ${stepTitle}`);
				console.log(`Commits created for template/solution step ${step}.`);
				continue;
			}

			if (hasSource) {
				copySnapshot(sourceDir, repoPath);
				await git.add('*');
				const hasContent = folderHasNonDocFiles(sourceDir);
				let commitPrefix = hasContent ? 'action' : 'section';
				if (!hasContent && index === 0) {
					commitPrefix = 'readme';
				}
				await git.commit(`${commitPrefix}: ${stepTitle}`);
				console.log(`Commit created for step ${step} with message: ${commitPrefix}: ${stepTitle}`);
				continue;
			}

			console.warn(`Skipping step ${step}: no template/solution/source folder found.`);
		}

		fs.rmSync(tempDir, { recursive: true });
		console.log("Temporary files removed.");
		console.log('Gitorial branch generated successfully from mdBook.');
	} catch (error) {
		console.error('Error:', error.message || error);
	}
}

module.exports = repackMdbook;
