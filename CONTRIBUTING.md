# Contributing

Any and all contributions to Rivet are welcome and encouraged!

If you have any bug reports, questions, ideas, or unexpected behavior feel free to [open an issue](https://github.com/Ironclad/rivet/issues/new/choose) or [start a discussion](https://github.com/Ironclad/rivet/discussions/new). It's always a good idea to see if your issue has already been reported before opening a new one.

- [Running from Source](#running-from-source)
  - [Prerequisites](#prerequisites)
  - [Building and Running](#building-and-running)
- [IDE Configuration](#ide-configuration)
  - [VS Code](#vs-code)
  - [Other IDEs \& Troubleshooting](#other-ides--troubleshooting)
- [Building Packages](#building-packages)
- [Tests](#tests)
  - [Linting](#linting)
- [Node Executor](#node-executor)
- [Releasing](#releasing)

## Running from Source

### Prerequisites

- [volta](https://volta.sh/) or Node.js >=20
- [rust](https://rustup.rs/)
- [yarn](https://yarnpkg.com/getting-started/install)
- [macOS](https://www.apple.com/ca/macos/sonoma/) (Mac only) macOS 12.3 or higher

### Building and Running

Due to the size of the repository (package tarballs are committed), it is recommended to use a [blobless clone](https://github.blog/2020-12-21-get-up-to-speed-with-partial-clone-and-shallow-clone/) to download the repository more quickly.

1. Clone the repository to your local machine, for example using SSH:

```bash
git clone --filter=blob:none git@github.com:Ironclad/rivet.git
```

1. `cd` into your the cloned folder and run `yarn` in the root folder
2. Start the app in development mode by running `yarn dev`

## IDE Configuration

Rivet makes use of yarn PnP, so some editor configuration may be necessary:

### VS Code

1. Install the [ZipFS](https://marketplace.visualstudio.com/items?itemName=arcanis.vscode-zipfs) extension (or install recommended extensions)
2. Open the command palette and run `TypeScript: Select TypeScript Version`
3. Select `Use Workspace Version`

### Other IDEs & Troubleshooting

More information is available here: https://yarnpkg.com/getting-started/editor-sdks

## Building Packages

To build all packages, run `yarn build` in the root folder. This will compile the TypeScript for all packages, and build everything for a production release.

To build a specific package, run `yarn build` in the package folder. For example, to build the `@ironclad/rivet-core` package, run `yarn build` in the `packages/core` folder.

## Tests

To run tests, run `yarn test` in the root folder. This will run all tests for all packages.

To run tests for a specific package, run `yarn test` in the package folder. For example, to run tests for the `@ironclad/rivet-core` package, run `yarn test` in the `packages/core` folder.

Testing will also run linting at the same time.

### Linting

Rivet uses [ESLint](https://eslint.org/) for linting and [Prettier](https://prettier.io/) for formatting. To run linting, run `yarn lint` in the root folder. This will run linting for all packages.

In VS Code, ESLint is configured to run automatically on save. We also recommend enabling the `Format on Save` option in VS Code to automatically format files with Prettier on save.

## Node Executor

Certain nodes need to run in the "Node Executor." This starts a "sidecar" process, which can be difficult to develop with. If you are developing a feature or plugin that requires the Node Executor, consider running the node executor directly:

```
cd packages/app-executor
yarn start --port 21889
```

This will reduce the build time. However, you will still need to restart the sidecar whenever you make a code change.

## Releasing

First, tag and publish the NPM libraries.

To do this, you need to be a member of the Ironclad NPM organization. Set up `~/.yarnrc`, so that your NPM credentials are properly set up (`npmAuthToken` value needs to be set).

1. Update the version number in package.json for `packages/cli`, `packages/core`, and `packages/node`.
2. Run `yarn publish`. This may update relevant `README.md` files.
3. Git add `package.json` changes and `README.md` changes, then `git commit -m "Libs v1.14.0"` the package changes.
4. `git tag v1.14.0`
5. `git push --tags`
6. `git push origin main`
7. Create a [release in Github](https://github.com/Ironclad/rivet/releases/new), with title "Rivet Libraries v1.14.0" and two H2 sections (New Features and Bug Fixes).

- UNCHECK "Set as the latest release"
- THEN "Publish Release"

Then, release new version of `app`

1. Update `tauri.conf.json` version number.
2. Git add `tauri.conf.json`, then `git commit -m "App v1.7.4"`
3. `git tag app-v1.7.4`
4. `git push --tags`
5. `git push origin main`

This kicks off the CI process, which will create a new release as a draft.

Then, write up the release notes for the application release.

Once the release is ready, it will show up on the [Github releases page](https://github.com/Ironclad/rivet/releases) as a draft.

1. Update the release notes.
2. Publish the release.

   - KEEP "Set as the latest release" CHECKED

3. Download `latest.json`

   - Check that all Darwin builds have the same signature.

4. In `latest.json`, update the notes field. This supports Markdown syntax, and will show up in the Rivet UI when it gets updated.
5. Upload `latest.json` to the release (after deleting the old `latest.json`).
6. Set as latest release, and update the release.

Once the release is out and tested, announce the release on Discord and social.
