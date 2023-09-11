# Rivet API Reference

This section of the Rivet documentation goes over the TypeScript APIs for `@ironclad/rivet-core` and `@ironclad/rivet-node`.

To get started with integrating Rivet into your existing TypeScript or JavaScript application, see the [Integration - Getting Started](./api-reference/getting-started-integration.mdx) page.

## `@ironclad/rivet-core`

Rivet core is a pure ESM package that contains the core Rivet APIs. It has no dependencies on browser or node.js APIs and can be used in any JavaScript environment that supports modern ESM, including embedded environments such as PythonMonkey.

The Rivet application uses Rivet core to run graphs directly in the application.

See the [Rivet core overview](./api-reference/core/overview.mdx) for more information.

## `@ironclad/rivet-node`

Rivet node is a Node.js binding for Rivet core. It includes helper APIs to load rivet graphs from the filesystem and execute them.

You will most likely want to use Rivet node in your application. All types from Rivet core are re-exported from Rivet node, so you can use Rivet node as a drop-in replacement for Rivet core.

See the [Rivet node overview](./api-reference/node/overview.mdx) for more information.

### Requirements

Rivet node requires Node.js 16 or later.
