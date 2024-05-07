# cli

The gitorial-cli is a CLI tool for helping manage and work with a Git repo following the [Gitorial format](https://github.com/gitorial-sdk).

## Commands

The following commands are available in this CLI:

### unpack

```sh
yarn start unpack <gitorialPath> <gitorialBranch> <unpackedBranch>
```

The `unpack` command will take a branch in the Gitorial format, and unpack the steps of the gitorial into numbered folders in a separate branch.

`unpackedBranch` can be an existing branch, and a new commit will be added on top of the existing history.

A `gitorial_metadata.json` file will be created in each folder, allowing you to update the `commitMessage` for that step when the Gitorial is repacked.

### repack

```sh
yarn start repack <gitorialPath> <unpackedBranch> <repackBranch>
```

The `repack` command will take a branch which is in the `unpacked` format (numbered folders with the content of each step), and create a fresh git commit history with those steps as commits in the Gitorial.

`repackBranch` cannot be an existing branch name, as it risks deleting your Git history by mistake.

The `gitorial_metadata.json` file will not be included in your repacked Gitorial.

## Workflow

The workflow for managing a gitorial is still in development, but assumes the following:

- You have a Git repo with a branch in the Gitorial format.
- You can `unpack` that branch into a branch named `unpacked`.
    - You can keep this branch around forever, and always unpack into it. It can act as a history of changes to your Gitorial, since your raw Gitorial always resets its history.
- You can then make changes to files in the `unpacked` branch. For example:
    - Creating new step folders.
	- Editing README or other documentation.
	- Editing code.
		- Although it is suggested to make code changes on the Gitorial branch, allowing you to use Git merge to ensure all changes are propagated through the tutorial.
- You can commit changes or merge pull requests into the `unpacked` branch like normal.
- When you are happy with the `unpacked` branch, you can `repack` it into a new branch `repacked`.
- You can audit your changes in Git history (making sure step by step changes have a clean diff).
- Finally, you can use `git reset repacked && git push --force` on your Gitorial branch to update your Gitorial.
