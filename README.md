# Rivet

Rivet is an IDE for making LLM prompt chains, AI agents, and complex interconnected LLM interations. It features a node-based editor with an integrated debugger. 

## Getting Started

### Prebuilt Binaries

None are available yet.

### Prerequisites

* Make sure [Rust is installed](https://rustup.rs/)
* [yarn](https://yarnpkg.com/getting-started/install)

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
