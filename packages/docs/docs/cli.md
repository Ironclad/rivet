# Rivet CLI

The Rivet CLI is a command line companion tool for Rivet that provides a number of useful commands for working with Rivet projects. The CLI is published under
NPM as [@ironclad/rivet-cli](https://www.npmjs.com/package/@ironclad/rivet-cli).

## Installation

The Rivet CLI does not need to be installed, and can be run using `npx` or `yarn dlx`. For example:

```bash
npx @ironclad/rivet-cli --help
```

If you would like to install the CLI globally, you can do so using NPM:

```bash
npm install -g @ironclad/rivet-cli
```

Then, rivet is available under the command `rivet`:

```bash
rivet --help
```

## Commands

The Rivet CLI provides the following commands:

- [`rivet run`](./cli/run.md) - Runs a rivet graph in a project using provided input values.
- [`rivet serve`](./cli/serve.md) - Serves a rivet project using a local server.

See the documentation for each command for more information.

## Docker

The Rivet CLI `serve` command is also available as a Docker image. You can run the Rivet server using Docker with the following command:

```bash
docker run -p 3000:3000 -v $(pwd):/app abrenenkeironclad/rivet-server
```

See the [Docker page](./cli/docker) for more information.
