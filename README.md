# gitorial-cli

Tools for building step-by-step tutorials that are easy to contribute to and easy to render as clean, commit-based Gitorials.

This CLI helps you move between two tutorial representations:

- `master` (or your workshop branch): mdBook-friendly, contributor-friendly structure
- `gitorial`: commit-driven tutorial flow (`section`, `action`, `template`, `solution`)

## Install

```sh
npm install -g gitorial-cli
```

For local development in this repo:

```sh
npm install
```

## Commands

### `build-gitorial`

Generate a gitorial branch from your mdBook workshop branch.

```sh
gitorial-cli build-gitorial -r /path/to/repo -i master -o gitorial -s src --force
```

Options:

- `-r, --repo <path>` repo path (default: current directory)
- `-i, --input <branch>` workshop branch (default: `master`)
- `-o, --output <branch>` gitorial branch (default: `gitorial`)
- `-s, --source <dir>` mdBook source directory in input branch (default: `src`)
- `--force` recreate output branch if it exists
- `--verbose` verbose logs

Behavior:

- Rebuilds `output` as a fresh orphan branch.
- Rewrites commit history on the output branch by design.
- Copies full step snapshots per commit, so output branch content is tutorial snapshot content.

### `build-mdbook`

Generate or update an mdBook workshop branch from a gitorial branch.

```sh
gitorial-cli build-mdbook -r /path/to/repo -i gitorial -o master -s src
```

Options:

- `-r, --repo <path>` repo path (default: current directory)
- `-i, --input <branch>` gitorial branch (default: `gitorial`)
- `-o, --output <branch>` workshop branch (default: `master`)
- `-s, --source <dir>` output mdBook source directory (default: `src`)
- `--force` accepted but ignored (history is preserved)
- `--verbose` verbose logs

Behavior:

- Preserves output branch history.
- Replaces only the `source` directory content (for example `src/` or `example/src/`).
- Leaves files outside that directory untouched.

## Step Types

A gitorial step must map to one of these types:

- `section`: intro/context step, README only
- `action`: non-template operational step
- `template`: TODO step, must be followed by a `solution`
- `solution`: working result of preceding template

Declare type in markdown using a hidden comment:

```md
<!-- gitorial: action -->
```

Supported forms:

- `<!-- gitorial: section -->`
- `<!-- gitorial: action -->`
- `<!-- gitorial: template -->`
- `<!-- gitorial: solution -->`

## mdBook Workshop Layout

Expected source layout:

```text
src/
  SUMMARY.md
  0/
    README.md                     # section-only step (optional)
  1/
    README.md                     # generated step page with Monaco
    source/
      README.md                   # action/section source content
      ...
  2/
    README.md                     # generated step page with Monaco
    template/
      README.md
      ...
    solution/
      README.md
      ...
  _gitorial/
    monaco-setup.js
    monaco-setup.css
```

Notes:

- `README.md` inside each step folder is the rendered page shell.
- `files.json` is generated per interactive step to drive Monaco file selection.
- Section-only steps are represented as numbered folders with only `README.md`.

## Workflow Expectations

- Run commands from a clean working tree.
- Commands switch branches in the target repo.
- Use dedicated branches for workshop and gitorial.

## CI

Template workflow:

- `templates/gitorial-sync.yml`
- Syncs `gitorial` on pushes to `master`

This repo also includes a concrete workflow:

- `.github/workflows/sync-gitorial.yml`
- Builds `gitorial` from `example/src` on pushes to `master`

## Example in This Repo

See `example/` for a complete fixture with all step types.

Round-trip commands for this repo:

```sh
node src/index.js build-gitorial -r . -i master -o gitorial -s example/src --force
node src/index.js build-mdbook -r . -i gitorial -o master -s example/src
```
