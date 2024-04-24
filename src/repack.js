const simpleGit = require('simple-git');
const fs = require('fs');
const path = require('path');

async function organizeCommits(inputPath, outputPath) {
  try {
    const git = simpleGit(outputPath);

    // Get list of commits
    const commits = fs.readdirSync(inputPath)
      .filter(item => fs.statSync(path.join(inputPath, item)).isDirectory())
      .sort((a, b) => parseInt(a) - parseInt(b)); // Sort folders numerically

    for (const commit of commits) {
      const commitFolderPath = path.join(inputPath, commit);

      // Read commit message from commit_info.json
      const commitInfoPath = path.join(commitFolderPath, 'commit_info.json');
      const commitInfo = JSON.parse(fs.readFileSync(commitInfoPath, 'utf-8'));
      const commitMessage = commitInfo.commitMessage;

      // Copy files from numbered folder to output path
      const files = fs.readdirSync(commitFolderPath);
      files.forEach(file => {
        const sourcePath = path.join(commitFolderPath, file);
        const targetPath = path.join(outputPath, file);
        fs.copyFileSync(sourcePath, targetPath);
      });

      // Stage all files
      await git.add('*');

      // Create commit with commit message
      await git.commit(commitMessage);

      console.log(`Commit created for folder ${commit} with message: ${commitMessage}`);
    }

    console.log('Commits created successfully.');
  } catch (error) {
    console.error('Error:', error.message || error);
  }
}

module.exports = organizeCommits;
