# cli

The gitorial-cli is a CLI tool for helping manage and work with a Git repo following the [Gitorial format](https://github.com/gitorial-sdk).

## Commands

The CLI exposes various commands for managing a Gitorial.

```sh
Commands:
  unpack [options]  Unpack a Gitorial into another branch.
  repack [options]  Create a repacked Gitorial from an unpacked Gitorial. Must repack into a new branch.
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

Example: Convert an Gitorial repository from branch `gitorial` into branch `master` as an unpacked set of numbered steps in a folder named `steps`.

```sh
gitorial-cli unpack -p /path/to/rust-state-machine -i gitorial -o master -s steps
```

Output:

```sh
# git branch: master
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

Example: Convert an "unpacked" Gitorial on branch `master` in folder `steps` to a branch `gitorial`

```sh
gitorial-cli repack -p /path/to/rust-state-machine -i master -s steps -o gitorial
```

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
gitorial-cli mdbook -p /path/to/rust-state-machine -i gitorial -o mdbook
```
