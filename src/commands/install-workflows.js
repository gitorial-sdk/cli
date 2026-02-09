const fs = require('fs');
const path = require('path');
const { createLogger } = require('../lib/logger');
const { createGit, ensureBranchExists, checkoutBranch } = require('../lib/git');
const { ensureDir } = require('../lib/fs');

function loadTemplate(templateName) {
	const templatePath = path.resolve(__dirname, '..', '..', 'templates', templateName);
	if (!fs.existsSync(templatePath)) {
		throw new Error(`Missing workflow template: ${templatePath}`);
	}
	return fs.readFileSync(templatePath, 'utf8');
}

function renderTemplate(template, values) {
	let output = template;
	for (const [key, value] of Object.entries(values)) {
		const token = new RegExp(`__${key}__`, 'g');
		output = output.replace(token, value);
	}
	return output;
}

function writeFileIfAllowed(filePath, content, force) {
	const exists = fs.existsSync(filePath);
	if (exists && !force) {
		throw new Error(`Workflow already exists: ${filePath}. Re-run with --force to overwrite.`);
	}
	fs.writeFileSync(filePath, content);
	return exists ? 'updated' : 'created';
}

async function installWorkflows(options) {
	const logger = createLogger(options);
	const repoPath = path.resolve(options.repo);
	const inputBranch = options.input;
	const outputBranch = options.output;
	const sourceDir = options.source;
	const force = Boolean(options.force);
	const commit = Boolean(options.commit);

	const git = createGit(repoPath);
	const branches = await git.branchLocal();
	const originalBranch = branches.current;
	await ensureBranchExists(git, inputBranch);

	const workflowsDir = path.join(repoPath, '.github', 'workflows');
	ensureDir(workflowsDir);

	const replacements = {
		INPUT_BRANCH: inputBranch,
		OUTPUT_BRANCH: outputBranch,
		SOURCE_DIR: sourceDir,
	};

	try {
		if (originalBranch !== inputBranch) {
			logger.info(`Checking out ${inputBranch}...`);
			await checkoutBranch(git, inputBranch);
		}

		const workflowSpecs = [
			{ fileName: 'check.yml', templateName: 'check.yml' },
			{ fileName: 'deploy.yml', templateName: 'deploy.yml' },
			{ fileName: 'gitorial-sync.yml', templateName: 'gitorial-sync.yml' },
		];

		for (const spec of workflowSpecs) {
			const rendered = renderTemplate(loadTemplate(spec.templateName), replacements);
			const targetPath = path.join(workflowsDir, spec.fileName);
			const action = writeFileIfAllowed(targetPath, rendered, force);
			logger.info(`${action}: .github/workflows/${spec.fileName}`);
		}

		if (commit) {
			await git.add('.github/workflows');
			const status = await git.status();
			if (!status.isClean()) {
				await git.commit('Add tutorial CI workflows');
				logger.info('Committed workflow changes.');
			} else {
				logger.info('No workflow changes to commit.');
			}
		}
	} finally {
		if (originalBranch && originalBranch !== inputBranch) {
			await checkoutBranch(git, originalBranch);
		}
	}
}

module.exports = { installWorkflows };
