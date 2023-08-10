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

## Running from Source

### Prerequisites

- [volta](https://volta.sh/) or Node.js >=20
- [rust](https://rustup.rs/)
- [yarn](https://yarnpkg.com/getting-started/install)

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
