# gitorial-cli

Tools for building step-by-step tutorials that are easy to contribute to and easy to render as clean, commit-based Gitorials.

## Design

This CLI is optimized for open-source tutorials:

- `master` is the public, editable mdBook workshop branch.
- `gitorial` is a generated branch with clean, tutorial-grade commits.

Contributors work on `master`. Maintainers or CI regenerate `gitorial`.

## Install

```sh
npm install -g gitorial-cli
```

## Commands

```sh
Commands:
  build-gitorial [options]  Generate a gitorial branch from an mdBook workshop branch.
  build-mdbook [options]    Generate an mdBook workshop branch from a gitorial branch.
```

### build-gitorial

Generate the `gitorial` branch from the mdBook workshop on `master`.

```sh
gitorial-cli build-gitorial -r /path/to/project -i master -o gitorial
```

Options:

- `-r, --repo <path>`: path to the repo (default: current directory)
- `-i, --input <branch>`: workshop branch (default: `master`)
- `-o, --output <branch>`: gitorial branch (default: `gitorial`)
- `-s, --source <dir>`: mdBook source dir (default: `src`)
- `--force`: replace output branch if it exists
- `--verbose`: verbose logging

### build-mdbook

Generate an mdBook workshop branch from a gitorial branch.

```sh
gitorial-cli build-mdbook -r /path/to/project -i gitorial -o master
```

Options:

- `-r, --repo <path>`: path to the repo (default: current directory)
- `-i, --input <branch>`: gitorial branch (default: `gitorial`)
- `-o, --output <branch>`: workshop branch (default: `master`)
- `-s, --source <dir>`: mdBook source dir (default: `src`)
- `--force`: replace output branch if it exists
- `--verbose`: verbose logging

## mdBook Layout Expectations

The workshop branch is expected to be an mdBook source layout with numbered steps and a single markdown page per step:

```
src/
  0/
    README.md
    source/
      README.md
  1/
    README.md
    template/
      README.md
    solution/
      README.md
  2/
    README.md
    source/
      README.md
```

Each step folder may contain:

- `source/` for a single-step change
- `template/` and `solution/` for TODO + solution steps

Each step `README.md` is generated to include a Monaco editor with a "View solution" toggle.
The CLI writes shared Monaco assets to `src/_gitorial/`.

The CLI uses the first `# Heading` in the step README as the step title, sourced from:
- `template/README.md` for template/solution steps
- `source/README.md` for action/section steps

## CI Pipeline (Template)

There is a ready-to-copy GitHub Actions workflow at `templates/gitorial-sync.yml` that:

- Runs on pushes to `master`
- Regenerates `gitorial`
- Force-pushes `gitorial` back to the repo

## Contributing

Edit content in `master`. Do not edit `gitorial` directly.
