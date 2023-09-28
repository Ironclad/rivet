# Rivet
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-4-orange.svg?style=flat-square)](#contributors-)
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
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/gogwilt"><img src="https://avatars.githubusercontent.com/u/448108?v=4?s=100" width="100px;" alt="Cai GoGwilt"/><br /><sub><b>Cai GoGwilt</b></sub></a><br /><a href="https://github.com/Ironclad/rivet/commits?author=gogwilt" title="Code">💻</a> <a href="#business-gogwilt" title="Business development">💼</a> <a href="#ideas-gogwilt" title="Ideas, Planning, & Feedback">🤔</a> <a href="#maintenance-gogwilt" title="Maintenance">🚧</a> <a href="#promotion-gogwilt" title="Promotion">📣</a> <a href="https://github.com/Ironclad/rivet/pulls?q=is%3Apr+reviewed-by%3Agogwilt" title="Reviewed Pull Requests">👀</a> <a href="https://github.com/Ironclad/rivet/issues?q=author%3Agogwilt" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/teddycoleman"><img src="https://avatars.githubusercontent.com/u/15386324?v=4?s=100" width="100px;" alt="Teddy Coleman"/><br /><sub><b>Teddy Coleman</b></sub></a><br /><a href="https://github.com/Ironclad/rivet/commits?author=teddycoleman" title="Code">💻</a> <a href="https://github.com/Ironclad/rivet/issues?q=author%3Ateddycoleman" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/tberman"><img src="https://avatars.githubusercontent.com/u/183738?v=4?s=100" width="100px;" alt="Todd Berman"/><br /><sub><b>Todd Berman</b></sub></a><br /><a href="https://github.com/Ironclad/rivet/commits?author=tberman" title="Code">💻</a> <a href="https://github.com/Ironclad/rivet/issues?q=author%3Atberman" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/a-rothwell"><img src="https://avatars.githubusercontent.com/u/12634659?v=4?s=100" width="100px;" alt="Andrew Rothwell"/><br /><sub><b>Andrew Rothwell</b></sub></a><br /><a href="#tutorial-a-rothwell" title="Tutorials">✅</a> <a href="https://github.com/Ironclad/rivet/commits?author=a-rothwell" title="Documentation">📖</a> <a href="https://github.com/Ironclad/rivet/commits?author=a-rothwell" title="Code">💻</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!