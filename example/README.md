# Example Tutorial

This folder is a self-contained test fixture for the CLI.

Use it to verify mdBook generation, gitorial branch creation, and GitHub Pages deployment:

```sh
# From the repo root
node src/index.js build-mdbook -r ./example -i gitorial -o master --force
node src/index.js build-gitorial -r ./example -i master -o gitorial --force
mdbook serve ./example
```

The workshop source lives in `example/src/` and follows the expected layout.
It includes examples of all gitorial step types:

- `section` in `src/0/README.md`
- `action` in `src/1/source/README.md`
- `template` and `solution` pairs in `src/2/*` and `src/3/*`

GitHub Pages is configured via `.github/workflows/example-pages.yml` and builds the `example/` book.
