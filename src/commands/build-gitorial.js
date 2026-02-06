const fs = require('fs');
const os = require('os');
const path = require('path');
const { createLogger } = require('../lib/logger');
const { createGit, ensureBranchExists, createOrphanBranch } = require('../lib/git');
const {
	copyDir,
	ensureDir,
	hasNonDocFiles,
	listNumericDirs,
	readFirstHeading,
	removeAllExcept,
} = require('../lib/fs');

function getStepTitle(stepDir) {
	const candidates = [
		path.join(stepDir, 'template', 'README.md'),
		path.join(stepDir, 'source', 'README.md'),
		path.join(stepDir, 'solution', 'README.md'),
		path.join(stepDir, 'README.md'),
	];
	for (const candidate of candidates) {
		const title = readFirstHeading(candidate);
		if (title) {
			return title;
		}
	}
	return path.basename(stepDir);
}

function copySnapshot(sourceDir, repoPath) {
	const filter = (sourcePath, isDirectory) => {
		const baseName = path.basename(sourcePath);
		if (baseName === '.git') {
			return false;
		}
		if (!isDirectory && baseName.endsWith('.diff')) {
			return false;
		}
		return true;
	};
	removeAllExcept(repoPath, ['.git']);
	copyDir(sourceDir, repoPath, filter);
}

async function buildGitorial(options) {
	const logger = createLogger(options);
	const repoPath = path.resolve(options.repo);
	const inputBranch = options.input;
	const outputBranch = options.output;
	const sourceDirName = options.source;

	const git = createGit(repoPath);
	await ensureBranchExists(git, inputBranch);

	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gitorial-mdbook-'));
	const sourceGit = createGit(tempDir);

	try {
		logger.info(`Cloning ${inputBranch} into temporary workspace...`);
		await sourceGit.clone(repoPath, tempDir, ['--branch', inputBranch]);

		const mdbookSourceDir = path.join(tempDir, sourceDirName);
		if (!fs.existsSync(mdbookSourceDir)) {
			throw new Error(`mdBook source directory not found: ${mdbookSourceDir}`);
		}

		const steps = listNumericDirs(mdbookSourceDir);
		if (steps.length === 0) {
			throw new Error(`No step folders found in ${mdbookSourceDir}`);
		}

		await createOrphanBranch(git, outputBranch, {
			force: options.force,
			fromBranch: inputBranch,
		});

		for (const [index, step] of steps.entries()) {
			const stepDir = path.join(mdbookSourceDir, step);
			const stepTitle = getStepTitle(stepDir);
			const templateDir = path.join(stepDir, 'template');
			const solutionDir = path.join(stepDir, 'solution');
			const sourceDir = path.join(stepDir, 'source');

			const hasTemplate = fs.existsSync(templateDir);
			const hasSolution = fs.existsSync(solutionDir);
			const hasSource = fs.existsSync(sourceDir);

			if (hasTemplate && hasSolution) {
				logger.info(`Step ${step}: template/solution → ${stepTitle}`);
				copySnapshot(templateDir, repoPath);
				await git.add('.');
				await git.commit(`template: ${stepTitle}`);

				copySnapshot(solutionDir, repoPath);
				await git.add('.');
				await git.commit(`solution: ${stepTitle}`);
				continue;
			}

			if (hasSource) {
				logger.info(`Step ${step}: source → ${stepTitle}`);
				copySnapshot(sourceDir, repoPath);
				await git.add('.');

				const hasContent = hasNonDocFiles(sourceDir);
				let prefix = hasContent ? 'action' : 'section';
				if (!hasContent && index === 0) {
					prefix = 'readme';
				}

				await git.commit(`${prefix}: ${stepTitle}`);
				continue;
			}

			logger.warn(`Skipping step ${step}: no template/solution/source folder found.`);
		}

		logger.info('Gitorial branch generated successfully.');
	} finally {
		fs.rmSync(tempDir, { recursive: true, force: true });
	}
}

module.exports = { buildGitorial };
