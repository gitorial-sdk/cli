const simpleGit = require("simple-git");
const fs = require("fs");
const os = require('os');
const path = require("path");
const { copyAllContentsAndReplace, copyFilesAndDirectories, doesBranchExist } = require("./utils");

async function mdbook(repoPath, inputBranch, outputBranch, subFolder) {
	try {
		// Create a new temporary folder
		const sourceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gitorial-source-'));
		const mdbookDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gitorial-mdbook-'));

		// Clone the repo into the source folder.
		const tempGit = simpleGit(sourceDir);

		// Resolve the full path to the local repository
		const resolvedRepoPath = path.resolve(repoPath);
		await tempGit.clone(resolvedRepoPath, '.', ['--branch', inputBranch]);

		await processGitorial(sourceDir, mdbookDir);

		let sourceGit = simpleGit(repoPath);
		// Check if the branch exists in the list of local branches
		const branchExists = await doesBranchExist(sourceGit, outputBranch)

		if (!branchExists) {
			// Create a fresh branch if it does not exist.
			await sourceGit.raw(['switch', '--orphan', outputBranch]);
		} else {
			// Checkout the current branch if it does.
			await sourceGit.checkout(outputBranch);
		}

		let outputFolder = repoPath;
		if (subFolder) {
			outputFolder = path.join(outputFolder, subFolder);
		}

		copyAllContentsAndReplace(mdbookDir, outputFolder);

		// Stage all files
		await sourceGit.add('*');

		// Create commit with commit message
		await sourceGit.commit(`mdBook generated from ${inputBranch}`);

		// Clean up source folder
		fs.rmSync(sourceDir, { recursive: true });
		fs.rmSync(mdbookDir, { recursive: true });
		console.log("Temporary files removed.");

		console.log("mdBook completed.");
	} catch (error) {
		console.error('Error:', error.message || error);
	}
}

async function processGitorial(sourceDir, mdbookDir) {
	const sourceGit = simpleGit(sourceDir);

	// Retrieve commit log
	const logs = await sourceGit.log();

	let stepCounter = 0;
	let templateFound = false;
	let solutionFound = false;
	let templateFiles = [];
	let solutionFiles = [];
	let sourceFiles = [];
	let stepNames = [];

	// Create a folder for each commit
	// Reverse to make the oldest commit first
	for ([index, log] of logs.all.reverse().entries()) {
		const commitHash = log.hash;
		const commitMessage = log.message;

		// These are the possible gitorial commit types
		const isReadme = commitMessage.toLowerCase().startsWith("readme: ");
		const isTemplate = commitMessage.toLowerCase().startsWith("template: ");
		const isSolution = commitMessage.toLowerCase().startsWith("solution: ");
		const isSection = commitMessage.toLowerCase().startsWith("section: ");
		const isAction = commitMessage.toLowerCase().startsWith("action: ");
		const isStartingTemplate = commitMessage.toLowerCase().startsWith("starting-template");

		// A step may not increment with a new commit, for example a `template` and `solution` happen in one step.
		let stepFolder = path.join(mdbookDir, stepCounter.toString());
		if (!fs.existsSync(stepFolder)) {
			fs.mkdirSync(stepFolder);
		}

		let sourceFolder = path.join(stepFolder, "source");
		let templateFolder = path.join(stepFolder, "template");
		let solutionFolder = path.join(stepFolder, "solution");

		// Default assumption is output is not a template or solution
		let outputFolder = sourceFolder;

		// We skip the starting template commit since it is only used for starting the project.
		if (isStartingTemplate) {
			continue;
		}

		if (isTemplate) {
			// Check there isn't a template already in queue
			if (templateFound) {
				console.error("A second template was found before a solution.");
				process.exit(1);
			}

			templateFound = true;

			// make step folder
			outputFolder = templateFolder;
		}

		if (isSolution) {
			// Check that there is a template in queue
			if (!templateFound) {
				console.error("No template was found for this solution.");
				process.exit(1);
			}

			// Check that a solution is not already found.
			if (solutionFound) {
				console.error("A second solution was found before a template.");
				process.exit(1);
			}

			solutionFound = true;
			outputFolder = solutionFolder;
		}

		fs.mkdirSync(outputFolder);

		// Checkout the commit
		console.log(`Checking out commit: ${commitHash}`);
		await sourceGit.checkout(commitHash)

		// Copy the contents to the commit folder
		copyFilesAndDirectories(sourceDir, outputFolder);
		console.log(`Contents of commit ${index} copied to ${outputFolder}`);

		let previousCommit = "HEAD~1";
		// This is the commit hash for an empty git project.
		let emptyTree = "4b825dc642cb6eb9a060e54bf8d69288fbee4904";

		if (index == 0) {
			previousCommit = emptyTree;
		}

		// Get the list of modified or created files in the commit
		const diffOutput = await sourceGit.diff(['--name-status', `${previousCommit}`, `HEAD`])
		// Get the raw diff between the previous commit and HEAD, excluding README.md
		const diffRaw = await sourceGit.diff([`${previousCommit}`, `HEAD`, ':(exclude)README.md']);

		// Create a raw output
		let diff_name = "changes.diff";
		if (isSolution) {
			diff_name = "solution.diff";
		} else if (isTemplate) {
			diff_name = "template.diff";
		}
		const diffFilePath = path.join(outputFolder, diff_name);
		fs.writeFileSync(diffFilePath, diffRaw);

		let fileStatus = diffOutput.split("\n").map((line) => {
			const [status, file] = line.split("\t");
			return { status, file };
		});

		if (isTemplate) {
			templateFiles = fileStatus;
		} else if (isSolution) {
			solutionFiles = fileStatus;
		} else {
			sourceFiles = fileStatus;
		}

		// Reset sanity check and increment step
		// Handle when both template and solution is found,
		// or when there is a step that is neither a template or solution
		if (
			(templateFound && solutionFound) ||
			(!templateFound && !solutionFound)
		) {
			if (isReadme) {
				markdownContent = sectionMarkdown;
			} else if (isSection) {
				markdownContent = sectionMarkdown;
				stepNames.push({
					name: getStepName(sourceFolder),
					is_section: true,
				});
			} else if (templateFound) {
				markdownContent = templateMarkdown;
				let templateFileText = generateFileMarkdown("template", templateFiles);
				let solutionFileText = generateFileMarkdown("solution", solutionFiles);
				markdownContent = markdownContent.replace(
					"<!-- insert_template_files -->",
					templateFileText
				);
				markdownContent = markdownContent.replace(
					"<!-- insert_solution_files -->",
					solutionFileText
				);

				let diffText = generateDiffMarkdown("template");
				markdownContent = markdownContent.replace(
					"<!-- insert_diff_files -->",
					diffText
				);

				stepNames.push({
					name: getStepName(templateFolder),
					is_section: false,
				});
			} else if (isAction) {
				markdownContent = sourceMarkdown;
				let sourceFileText = generateFileMarkdown("source", sourceFiles);
				markdownContent = markdownContent.replace(
					"<!-- insert_source_files -->",
					sourceFileText
				);

				let diffText = generateDiffMarkdown("source");
				markdownContent = markdownContent.replace(
					"<!-- insert_diff_files -->",
					diffText
				);

				stepNames.push({
					name: getStepName(sourceFolder),
					is_section: false,
				});
			} else {
				console.error(`Unknown Gitorial Commit Type: ${commitMessage}`)
			}
			// Create a Markdown file in the commit folder
			const markdownFilePath = path.join(stepFolder, "README.md");
			fs.writeFileSync(markdownFilePath, markdownContent);
			stepCounter += 1;
			templateFound = false;
			solutionFound = false;
		}
	}

	generateSidebar(mdbookDir, stepNames);

	console.log("Finished Parsing.");
}

// Generate the markdown text for files.
function generateFileMarkdown(type, files) {
	// type is expected to be one of "source", "solution", or "template"
	if (type != "solution" && type != "source" && type != "template") {
		process.exit(1);
	}

	let output = "";

	let parsedFiles = [];
	for (file of files) {
		if (!file.file) {
			continue;
		}

		// Skip all hidden folders, like `.gitorial`.
		if (file.file.startsWith(".")) {
			continue;
		}

		let filepath = `./${type}/${file.file}`;
		let filename = path.parse(filepath).base;

		// Skip README
		if (filename == "README.md") {
			continue;
		}
		// Skip hidden files
		if (filename.startsWith(".")) {
			continue;
		}
		// Skip Cargo.lock
		if (filename == "Cargo.lock") {
			continue;
		}

		let classStyle = `file-${type}`;
		if (file.status == "M") {
			classStyle += " file-modified";
		} else if (file.status == "A") {
			classStyle += " file-added";
		} else if (file.status == "D") {
			classStyle += " file-deleted";
		}

		let codeStyle = "text";
		let extname = path.extname(filepath);
		switch (extname) {
			case ".rs":
				codeStyle = "rust";
				break;
			case ".toml":
				codeStyle = "toml";
				break;
			case ".js":
				codeStyle = "js";
				break;
			case ".json":
				codeStyle = "json";
				break;
			case ".ts":
				codeStyle = "ts";
				break;
			default:
				codeStyle = "text";
		}

		parsedFiles.push({ filename: file.file, classStyle, codeStyle, filepath })
	}

	if (parsedFiles.length > 0) {
		output += `<div class="tab">\n`;

		for ([i, file] of parsedFiles.entries()) {
			output += `<button class="subtab tablinks ${file.classStyle}${i == 0 ? " active" : ""}" onclick="switchSubTab(event, '${file.filename}')" data-id="${file.filename}">${file.filename}</button>\n`;
		}

		output += `</div>\n`

		for ([i, file] of parsedFiles.entries()) {
			output += `<div id="${type}/${file.filename}" class="subtab tabcontent${i == 0 ? " active" : ""}" data-id="${file.filename}">\n\n`;
			output += `\`\`\`${file.codeStyle}\n{{#include ${file.filepath}}}\n\`\`\`\n\n`;
			output += `</div>\n\n`;
		}
	} else {
		output = "No files edited in this step.";
	}

	return output;
}

function generateDiffMarkdown(type) {
	let output = "";

	if (type == "template" || type == "solution") {
		output += solutionDiffMarkdown;
	} else {
		output += changesDiffMarkdown;
	}

	return output;
}

let solutionDiffMarkdown = `
<div class="tab">
	<button class="difftab tablinks active" onclick="switchDiff(event, 'template.diff')" data-id="template.diff">template.diff</button>
	<button class="difftab tablinks" onclick="switchDiff(event, 'solution.diff')" data-id="solution.diff">solution.diff</button>
</div>
<div id="template.diff" class="difftab tabcontent active" data-id="template.diff">

\`\`\`diff\n{{#include ./template/template.diff}}\n\`\`\`

</div>
<div id="solution.diff" class="difftab tabcontent" data-id="solution.diff">

\`\`\`diff\n{{#include ./solution/solution.diff}}\n\`\`\`

</div>`;

let changesDiffMarkdown = `
<div class="tab">
	<button class="difftab tablinks active" onclick="switchDiff(event, 'changes.diff')" data-id="changes.diff">changes.diff</button>
</div>
<div id="changes.diff" class="difftab tabcontent active" data-id="changes.diff">

\`\`\`diff\n{{#include ./source/changes.diff}}\n\`\`\`

</div>`;

let templateMarkdown = `
<div class="content-row">
<div class="content-col">

{{#include ./template/README.md}}

</div>

<div class="content-col">

<div class="tab">
  <button class="maintab tablinks active" onclick="switchMainTab(event, 'Template')">Template</button>
  <button class="maintab tablinks" onclick="switchMainTab(event, 'Solution')">Solution</button>
  <button class="maintab tablinks" onclick="switchMainTab(event, 'Diff')">Diff</button>
</div>

<div id="Template" class="maintab tabcontent active">

<!-- insert_template_files -->

</div>

<div id="Solution" class="maintab tabcontent">

<!-- insert_solution_files -->

</div>

<div id="Diff" class="maintab tabcontent">

<!-- insert_diff_files -->

</div>

</div>
</div>
`;

let sourceMarkdown = `
<div class="content-row">
<div class="content-col">

{{#include ./source/README.md}}

</div>
<div class="content-col">

<div class="tab">
  <button class="maintab tablinks active" onclick="switchMainTab(event, 'Source')">Source</button>
  <button class="maintab tablinks" onclick="switchMainTab(event, 'Diff')">Diff</button>
</div>

<div id="Source" class="maintab tabcontent active">

<!-- insert_source_files -->

</div>

<div id="Diff" class="maintab tabcontent">

<!-- insert_diff_files -->

</div>

</div>
</div>
`;

let sectionMarkdown = `
<div class="content-section">

{{#include ./source/README.md}}

</div>
`;

function getStepName(folder) {
	const filePath = path.join(folder, "README.md");
	const markdownContent = fs.readFileSync(filePath, "utf8");
	const titleMatch = markdownContent.match(/^#\s+(.*)/m);
	if (titleMatch) {
		return titleMatch[1];
	} else {
		console.error(`Error getting markdown title.`);
		process.exit(1);
	}
}

function generateSidebar(mdbookDir, steps) {
	const sidebarFilePath = path.join(mdbookDir, "SUMMARY.md");
	let output = "";
	steps.forEach(({ name, is_section }, index) => {
		if (!is_section) {
			output += `    `;
		}
		output += `- [${index}. ${name}](${index}/README.md)\n`;
	});
	fs.writeFileSync(sidebarFilePath, output);
}

module.exports = mdbook;
