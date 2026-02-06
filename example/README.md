# Example Tutorial

This folder is a test fixture for the CLI.

It includes examples of all gitorial step types:

- `section` in `src/0/README.md`
- `action` in `src/1/source/README.md`
- `template` and `solution` pairs in `src/2/*` and `src/3/*`

Run from the repository root:

```sh
node src/index.js build-gitorial -r . -i master -o gitorial -s example/src --force
node src/index.js build-mdbook -r . -i gitorial -o master -s example/src
mdbook serve ./example
```

GitHub Pages for this example is configured in `.github/workflows/example-pages.yml`.
Gitorial branch sync is configured in `.github/workflows/sync-gitorial.yml`.
