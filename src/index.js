const simpleGit = require('simple-git');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { execSync } = require("child_process");

const exec = promisify(require('child_process').exec);

async function cloneRepository(sourcePath, destinationPath) {
  try {
    await exec(`git clone ${sourcePath} ${destinationPath}`);
    console.log('Repository cloned successfully.');
  } catch (error) {
    throw new Error(`Failed to clone repository: ${error.message}`);
  }
}

async function organizeCommits(gitPath, outputPath) {
  try {
    // Clone the repository into a new folder
    const tempDir = path.join(outputPath, 'temp_repo');
    await cloneRepository(gitPath, tempDir);

    const git = simpleGit(tempDir);

    // Retrieve commit log
    const log = await git.log();

	// Get the list of commits
	console.log("Fetching commits...");
	const commitHashes = execSync(`git -C ${tempDir} log --format=%H::%s`, {
		encoding: "utf-8",
	})
		.trim()
		.split("\n");

	console.log(commitHashes)

	let stepCounter = 0;

	// Create a folder for each commit
	// Reverse to make the oldest commit first
	commitHashes.reverse().forEach((commitInfo, index) => {
		const [commitHash, commitMessage] = commitInfo.split("::");

		let stepFolder = path.join(outputPath, stepCounter.toString());
		if (!fs.existsSync(stepFolder)) {
			fs.mkdirSync(stepFolder);
		}

		// Checkout the commit
		console.log(`Checking out commit: ${commitHash}`);
		execSync(`git -C ${tempDir} checkout ${commitHash}`);

		// Copy the contents to the commit folder
		execSync(`cp -r ${tempDir}/* ${stepFolder}`);
		console.log(`Contents of commit ${index} copied to ${stepFolder}`);


		// Create a JSON file in the commit folder
		const jsonFilePath = path.join(stepFolder, "commit_info.json");
		const commitInfoObject = {
			commitMessage,
		};

		fs.writeFileSync(jsonFilePath, JSON.stringify(commitInfoObject, null, 2));


		stepCounter += 1;
	});

	// Clean up source folder
	fs.rmSync(tempDir, { recursive: true, force: true });

	console.log("Process completed.");

  } catch (error) {
    console.error('Error:', error.message || error);
  }

}

// Example usage
const gitPath = '../rust-state-machine';
const outputPath = './output';

organizeCommits(gitPath, outputPath);
