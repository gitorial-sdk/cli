const fs = require('fs');
const os = require('os');
const path = require('path');
const { createLogger } = require('../lib/logger');
const { createGit, ensureBranchExists, createOrphanBranch } = require('../lib/git');
const {
	copyDir,
	hasNonDocFiles,
	listNumericDirs,
	readFirstHeading,
	readGitorialType,
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

function resolveStepType(readmePath, defaultType) {
	const declaredType = readGitorialType(readmePath);
	if (!declaredType) {
		return defaultType;
	}
	return declaredType;
}

function assertStepType(step, actualType, allowedTypes) {
	if (!allowedTypes.includes(actualType)) {
		throw new Error(`Step ${step} has unsupported gitorial type "${actualType}". Allowed: ${allowedTypes.join(', ')}`);
	}
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

		for (const step of steps) {
			const stepDir = path.join(mdbookSourceDir, step);
			const stepTitle = getStepTitle(stepDir);
			const templateDir = path.join(stepDir, 'template');
			const solutionDir = path.join(stepDir, 'solution');
			const sourceDir = path.join(stepDir, 'source');
			const sectionReadme = path.join(stepDir, 'README.md');

			const hasTemplate = fs.existsSync(templateDir);
			const hasSolution = fs.existsSync(solutionDir);
			const hasSource = fs.existsSync(sourceDir);
			const hasSectionReadme = fs.existsSync(sectionReadme);

			if (hasTemplate && hasSolution) {
				logger.info(`Step ${step}: template/solution → ${stepTitle}`);
				const templateType = resolveStepType(path.join(templateDir, 'README.md'), 'template');
				const solutionType = resolveStepType(path.join(solutionDir, 'README.md'), 'solution');
				assertStepType(step, templateType, ['template']);
				assertStepType(step, solutionType, ['solution']);

				copySnapshot(templateDir, repoPath);
				await git.add('.');
				await git.commit(`${templateType}: ${stepTitle}`);

				copySnapshot(solutionDir, repoPath);
				await git.add('.');
				await git.commit(`${solutionType}: ${stepTitle}`);
				continue;
			}

			if (hasSource) {
				logger.info(`Step ${step}: source/action → ${stepTitle}`);
				const stepType = resolveStepType(path.join(sourceDir, 'README.md'), hasNonDocFiles(sourceDir) ? 'action' : 'section');
				assertStepType(step, stepType, ['action', 'section']);

				copySnapshot(sourceDir, repoPath);
				await git.add('.');
				await git.commit(`${stepType}: ${stepTitle}`);
				continue;
			}

			if (hasSectionReadme) {
				const stepType = resolveStepType(sectionReadme, 'section');
				assertStepType(step, stepType, ['section']);
				logger.info(`Step ${step}: section → ${stepTitle}`);
				fs.copyFileSync(sectionReadme, path.join(repoPath, 'README.md'));
				await git.add('README.md');
				await git.commit(`${stepType}: ${stepTitle}`);
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
