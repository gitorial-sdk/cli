# cli

The gitorial-cli is a CLI tool for helping manage and work with a Git repo following the [Gitorial format](https://github.com/gitorial-sdk).

## Install

Install this CLI via NPM:

```sh
npm install -g gitorial-cli
```

## Recommended Branch Layout

For open-source tutorials, the most contributor-friendly layout is:

- `master`: mdBook workshop source (the public, editable branch)
- `gitorial`: generated branch used for clean commit-by-commit diffs

`master` is what the community edits. `gitorial` is regenerated from `master` using `repack-mdbook`.

## Commands

The CLI exposes various commands for managing a Gitorial.

```sh
Commands:
  unpack [options]  Unpack a Gitorial into another branch.
  repack [options]  Create a repacked Gitorial from an unpacked Gitorial. Must repack into a new branch.
  repack-mdbook [options]  Create a Gitorial from an mdBook workshop layout. Must repack into a new branch.
  mdbook [options]  Scaffold the contents of a Gitorial in a new branch in the mdBook source format. You need to initialize an mdBook yourself
```

### unpack

```sh
Usage: index unpack [options]

Unpack a Gitorial into another branch.

Options:
  -p, --path <path>                  The local path for the git repo containing the Gitorial.
  -i, --inputBranch <inputBranch>    The branch in the repo with the Gitorial.
  -o, --outputBranch <outputBranch>  The branch where you want to unpack the Gitorial.
  -s, --subFolder <subFolder>        The subfolder (relative to the <path>) where you want the unpacked Gitorial to be placed.
  -h, --help                         display help for command
```

Example: Convert a Gitorial repository from branch `gitorial` into branch `workshop` as an unpacked set of numbered steps in a folder named `steps`.

```sh
gitorial-cli unpack -p /path/to/project -i gitorial -o workshop -s steps
```

Output:

```sh
# git branch: workshop
steps/
├─ 0/
├─ 1/
├─ 2/
├─ ...
```

### repack

```sh
Usage: index repack [options]

Create a repacked Gitorial from an unpacked Gitorial. Must repack into a new branch.

Options:
  -p, --path <path>                  The local path for the git repo containing the Gitorial.
  -i, --inputBranch <inputBranch>    The branch in the repo with the unpacked Gitorial.
  -o, --outputBranch <outputBranch>  The branch where you want to repack the Gitorial. Branch must not exist.
  -s, --subFolder <subFolder>        The subfolder (relative to the <path>) where you can find the unpacked Gitorial
  --force                            Force the repack, even if it would replace an existing branch. WARNING: this can delete the branch history!
  -h, --help                         display help for command
```

Example: Convert an "unpacked" Gitorial on branch `workshop` in folder `steps` to a branch `gitorial`

```sh
gitorial-cli repack -p /path/to/project -i workshop -s steps -o gitorial
```

### repack-mdbook

```sh
Usage: index repack-mdbook [options]

Create a Gitorial from an mdBook workshop layout. Must repack into a new branch unless --force is used.

Options:
  -p, --path <path>                  The local path for the git repo containing the tutorial.
  -i, --inputBranch <inputBranch>    The branch in the repo with the mdBook workshop.
  -o, --outputBranch <outputBranch>  The branch where you want to create the Gitorial. Branch must not exist.
  -s, --subFolder <subFolder>        The subfolder (relative to the <path>) where you can find the mdBook source (default: "src")
  --force                            Force the repack, even if it would replace an existing branch. WARNING: this can delete the branch history!
  -h, --help                         display help for command
```

Example: Generate a `gitorial` branch from an mdBook workshop on `master`:

```sh
gitorial-cli repack-mdbook -p /path/to/project -i master -o gitorial
```

Recommended workflow (open source friendly):

- Contributors edit `master` (mdBook workshop)
- Maintainers or CI run `repack-mdbook` to update `gitorial`

### CI Pipeline (Template)

There is a ready-to-copy GitHub Actions workflow template at `templates/gitorial-sync.yml` that:

- Runs on pushes to `master`
- Regenerates `gitorial` from the mdBook workshop
- Force-pushes `gitorial` back to the repo

### mdBook

```sh
Usage: index mdbook [options]

Scaffold the contents of a Gitorial in a new branch in the mdBook source format. You need to initialize an mdBook yourself

Options:
  -p, --path <path>                  The local path for the git repo containing the Gitorial.
  -i, --inputBranch <inputBranch>    The branch in the repo with the Gitorial.
  -o, --outputBranch <outputBranch>  The branch where you want your mdBook to live
  -s, --subFolder <subFolder>        The subfolder (relative to the <path>) where you want the mdBook source material to be placed. (default: "src")
  -h, --help                         display help for command
```

Example: Convert a Gitorial at branch `gitorial` to an [mdBook](https://rust-lang.github.io/mdBook/) rendered at branch `mdbook`.

```sh
gitorial-cli mdbook -p /path/to/project -i gitorial -o mdbook
```
