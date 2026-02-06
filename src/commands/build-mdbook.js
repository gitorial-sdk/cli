const fs = require('fs');
const os = require('os');
const path = require('path');
const { createLogger } = require('../lib/logger');
const { createGit, ensureBranchExists, createOrphanBranch } = require('../lib/git');
const {
	copyDir,
	ensureDir,
	readFirstHeading,
	removeAllExcept,
} = require('../lib/fs');
const { stepMarkdown } = require('../lib/mdbook-templates');
const { monacoCss, monacoSetup, monacoEmbed } = require('../lib/monaco-assets');

const EMPTY_TREE = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';

function classifyCommit(message) {
	const lower = message.toLowerCase();
	if (lower.startsWith('starting-template')) {
		return 'starting-template';
	}
	if (lower.startsWith('readme:')) {
		return 'readme';
	}
	if (lower.startsWith('section:')) {
		return 'section';
	}
	if (lower.startsWith('action:')) {
		return 'action';
	}
	if (lower.startsWith('template:')) {
		return 'template';
	}
	if (lower.startsWith('solution:')) {
		return 'solution';
	}
	return 'unknown';
}

function parseFileStatuses(diffOutput) {
	return diffOutput
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line) => {
			const [status, file] = line.split('\t');
			return { status, file };
		});
}

function filterFileEntries(entries, rootFolder) {
	const result = [];
	for (const entry of entries) {
		if (!entry.file) {
			continue;
		}
		if (entry.status === 'D') {
			continue;
		}
		if (entry.file.startsWith('.')) {
			continue;
		}
		const filename = path.parse(entry.file).base;
		if (filename === 'README.md') {
			continue;
		}
		if (filename.startsWith('.')) {
			continue;
		}
		if (filename === 'Cargo.lock') {
			continue;
		}

		result.push({
			label: entry.file,
			path: `./${rootFolder}/${entry.file}`,
			status: entry.status,
		});
	}
	return result;
}

function getStepTitle(folder) {
	const markdownPath = path.join(folder, 'README.md');
	const title = readFirstHeading(markdownPath);
	if (title) {
		return title;
	}
	throw new Error(`Missing step title in ${markdownPath}`);
}

function copySnapshot(sourceDir, targetDir) {
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
	copyDir(sourceDir, targetDir, filter);
}

async function buildMdbook(options) {
	const logger = createLogger(options);
	const repoPath = path.resolve(options.repo);
	const inputBranch = options.input;
	const outputBranch = options.output;
	const sourceDirName = options.source;

	const git = createGit(repoPath);
	await ensureBranchExists(git, inputBranch);

	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gitorial-mdbook-source-'));
	const sourceGit = createGit(tempDir);

	try {
		logger.info(`Cloning ${inputBranch} into temporary workspace...`);
		await sourceGit.clone(repoPath, tempDir, ['--branch', inputBranch]);

		const logs = await sourceGit.log();
		const commits = logs.all.reverse();

		await createOrphanBranch(git, outputBranch, {
			force: options.force,
			fromBranch: inputBranch,
		});

	const outputRoot = path.join(repoPath, sourceDirName);
	removeAllExcept(repoPath, ['.git']);
	ensureDir(outputRoot);
	const assetRoot = path.join(outputRoot, '_gitorial');
	ensureDir(assetRoot);
	fs.writeFileSync(path.join(assetRoot, 'monaco-setup.js'), monacoSetup);
	fs.writeFileSync(path.join(assetRoot, 'monaco-setup.css'), monacoCss);

		let stepCounter = 0;
		let pendingTemplate = null;
		let stepEntries = [];

		let previousCommit = EMPTY_TREE;

		for (const commit of commits) {
			const commitHash = commit.hash;
			const commitMessage = commit.message;
			const commitType = classifyCommit(commitMessage);

			if (commitType === 'starting-template') {
				previousCommit = commitHash;
				continue;
			}

			if (commitType === 'unknown') {
				throw new Error(`Unknown Gitorial commit type: ${commitMessage}`);
			}

			if (commitType === 'template') {
				if (pendingTemplate) {
					throw new Error('Found a template commit before completing a solution.');
				}
				pendingTemplate = { ...commit };
				previousCommit = commitHash;
				continue;
			}

			if (commitType === 'solution') {
				if (!pendingTemplate) {
					throw new Error('Found a solution commit without a preceding template.');
				}
				const stepFolder = path.join(outputRoot, stepCounter.toString());
				ensureDir(stepFolder);

				const templateFolder = path.join(stepFolder, 'template');
				const solutionFolder = path.join(stepFolder, 'solution');
				ensureDir(templateFolder);
				ensureDir(solutionFolder);

				await sourceGit.checkout(pendingTemplate.hash);
				copySnapshot(tempDir, templateFolder);

			const templateDiff = await sourceGit.diff(['--name-status', previousCommit, pendingTemplate.hash]);

				await sourceGit.checkout(commitHash);
				copySnapshot(tempDir, solutionFolder);

			const solutionDiff = await sourceGit.diff(['--name-status', pendingTemplate.hash, commitHash]);

			const templateEntries = filterFileEntries(parseFileStatuses(templateDiff), 'template');
			const solutionEntries = filterFileEntries(parseFileStatuses(solutionDiff), 'solution');

			const manifestPath = path.join(stepFolder, 'files.json');
			fs.writeFileSync(
				manifestPath,
				JSON.stringify(
					{
						template: templateEntries,
						solution: solutionEntries,
					},
					null,
					2
				)
			);

			let markdown = stepMarkdown;
			markdown = markdown.replace('<!-- insert_step_readme -->', './template/README.md');
			markdown = markdown.replace(
				'<!-- insert_monaco -->',
				monacoEmbed('../_gitorial', './files.json')
			);

			fs.writeFileSync(path.join(stepFolder, 'README.md'), markdown);

				const stepTitle = getStepTitle(templateFolder);
				stepEntries.push({ name: stepTitle, isSection: false });

				stepCounter += 1;
				pendingTemplate = null;
				previousCommit = commitHash;
				continue;
			}

			if (pendingTemplate) {
				throw new Error('Template commit must be followed by a solution commit.');
			}

			const stepFolder = path.join(outputRoot, stepCounter.toString());
			ensureDir(stepFolder);
			const sourceFolder = path.join(stepFolder, 'source');
			ensureDir(sourceFolder);

			await sourceGit.checkout(commitHash);
			copySnapshot(tempDir, sourceFolder);

			const diffOutput = await sourceGit.diff(['--name-status', previousCommit, commitHash]);
			const sourceEntries = filterFileEntries(parseFileStatuses(diffOutput), 'source');

			const manifestPath = path.join(stepFolder, 'files.json');
			fs.writeFileSync(
				manifestPath,
				JSON.stringify({ template: sourceEntries, solution: [] }, null, 2)
			);

			let markdown = stepMarkdown;
			markdown = markdown.replace('<!-- insert_step_readme -->', './source/README.md');
			markdown = markdown.replace(
				'<!-- insert_monaco -->',
				monacoEmbed('../_gitorial', './files.json')
			);
			fs.writeFileSync(path.join(stepFolder, 'README.md'), markdown);

			const stepTitle = getStepTitle(sourceFolder);
			stepEntries.push({ name: stepTitle, isSection: commitType === 'section' || commitType === 'readme' });

			stepCounter += 1;
			previousCommit = commitHash;
		}

		if (pendingTemplate) {
			throw new Error('Template commit did not have a matching solution.');
		}

	const summaryPath = path.join(outputRoot, 'SUMMARY.md');
	let summary = '# Summary\n\n';
	stepEntries.forEach((entry, index) => {
		if (!entry.isSection) {
			summary += '    ';
		}
		summary += `- [${index}. ${entry.name}](${index}/README.md)\n`;
	});
		fs.writeFileSync(summaryPath, summary);

		await git.add('.');
		await git.commit(`mdBook generated from ${inputBranch}`);
		logger.info('mdBook branch generated successfully.');
	} finally {
		fs.rmSync(tempDir, { recursive: true, force: true });
	}
}

module.exports = { buildMdbook };
