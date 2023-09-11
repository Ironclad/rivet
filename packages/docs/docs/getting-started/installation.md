# Installation

## System Requirements

### MacOS

- MacOS Monterey or later

### Windows

- Windows 10 or later

### Linux

- Modern version of `webkitgtk` installed that supports most of the recent web standards

## Releases

### [Latest Release on GitHub](https://github.com/Ironclad/rivet/releases/latest)

Download the latest release for your platform from the above link. Rivet is currently available for MacOS, Linux, and Windows.

## Building from Source

### Prerequisites

To build and run Rivet from source, you will need:

- Rust (use [rustup](https://rustup.rs/))
- node 20+ (or install [Volta](https://volta.sh/))
- yarn

### Install

A [blobless clone](https://github.blog/2020-12-21-get-up-to-speed-with-partial-clone-and-shallow-clone/) is recommended to download the repository more quickly. After cloning the repository, install the dependencies with `yarn`:

```bash
git clone --filter=blob:none git@github.com:Ironclad/rivet.git
cd rivet
yarn
```

### Build & Run

```bash
yarn dev
```

This will build and run the application in development mode.

Once running, proceed to [Setup](./setup.md)!
