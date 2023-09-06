# Installation

## Releases

### [Latest Release on GitHub](https://github.com/Ironclad/rivet/releases/latest)

Download the latest release for your platform from the above link. Rivet is currently available for MacOS and Linux. Windows
support is planned soon. Install the application and proceed to [Setup](./setup.md)!

## Building from Source

### Prerequisites

To build and run Rivet from source, you will need:

- Rust (use [rustup](https://rustup.rs/))
- node 20+ (or install [Volta](https://volta.sh/))
- yarn

### Install

A [blobless clone](https://github.blog/2020-12-21-get-up-to-speed-with-partial-clone-and-shallow-clone/) is recommanded to download the repository more quickly. After cloning the repository, install the dependencies with `yarn`:

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
