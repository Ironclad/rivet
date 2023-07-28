# Rivet
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-1-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

Rivet is an IDE for making LLM prompt chains, AI agents, and complex interconnected LLM interations. It features a node-based editor with an integrated debugger.

## Getting Started

### Prebuilt Binaries

None are available yet.

### Prerequisites

- Make sure [Volta is installed](https://volta.sh/) for using the correct node versions
- Make sure [Rust is installed](https://rustup.rs/)
- [yarn](https://yarnpkg.com/getting-started/install)

### Building and Running From Source

1. Clone the repository to your local machine.
2. Run `yarn` in the root folder
3. Start the app in development mode by running `yarn dev`
4. Make sure your OpenAI key and organization are set up in the Settings window.

## Project Structure

The project is a monorepo with 3 packages:

### core

The core ESM library that can run graphs.

### app

The [tauri](https://tauri.app/) application with the node editor.

### `node`

Helper package for bundling core as commonjs, and including helper functions for running graphs in node.js.

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/gogwilt"><img src="https://avatars.githubusercontent.com/u/448108?v=4?s=100" width="100px;" alt="Cai GoGwilt"/><br /><sub><b>Cai GoGwilt</b></sub></a><br /><a href="https://github.com/Ironclad/rivet/commits?author=gogwilt" title="Code">💻</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!