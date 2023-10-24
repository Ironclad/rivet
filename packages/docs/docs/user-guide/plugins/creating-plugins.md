# Creating a Plugin

## Introduction

Rivet plugins are written in JavaScript or TypeScript. They are published to NPM and installed into Rivet projects.

There are two main requirements for Rivet plugins:

1. **The plugin and node definitions must be pure, isomorphic JavaScript or TypeScript**. This means you cannot import any package that is not isomorphic, you cannot import any package that cannot be bundled into a single file, and you cannot import any Node.js packages.
2. **You cannot import Rivet itself into the plugins. You must export a function that takes in the Rivet library as its only argument.** As the plugin code is dynamically imported, it must be bundled into a _single file_. Therefore, you cannot use any `import` statements that cannot be bundled into a single file. You cannot import Rivet as this would conflict with the Rivet installation already running in Rivet. Therefore, the Rivet library is passed in as an argument. Your plugin must export only a function that takes in the Rivet library as its only argument.

## Example / Template Projects

There are two example projects that you can use as a starting point for your plugin:

- [rivet-plugin-example](https://github.com/abrenneke/rivet-plugin-example) - This is an example of a pure TypeScript plugin that does not use any Node.js code. This is the recommended place to start from, assuming you do not need to use Node.js code.
- [rivet-plugin-example-python-exec](https://github.com/abrenneke/rivet-plugin-example-python-exec) - If you have to run Node.js code in your plugin (and therefore your plugin will only work with the Node executor), use this as your starting point. This plugin is a complete example of how to write a plugin that uses Node.js code.

## Writing Plugins In Detail

### Important Notes

- You must bundle your plugins, or include all code for your plugin in the ESM files. Plugins are loaded using `import(pluginUrl)` so must follow all rules for ESM modules. This means that you cannot use `require` or `module.exports` in your plugin code. If you need to use external libraries, you must bundle them. The exception to this is when dual-bundling your plugin, to separate node.js and isomorphic code (explained below). It is recommended to use [ESBuild](https://esbuild.github.io/) to bundle your plugins.
- You cannot import nor bundle `@ironclad/rivet-core` or `@ironclad/rivet-node` in your plugin. The rivet core library is passed into your default export function as an argument. Be careful to only use `import type` statements for the core library, otherwise your plugin will not bundle successfully.
- If you are making a node.js plugin, it is important that you separate the plugin into two separate bundles - an isomorphic bundle that defines the plugin and all of the nodes, and a Node-only bundle that contains the node-only implementations. The isomorphic bundle is allowed to dynamically import the node bundle, but cannot statically import it (except for types, of course).

### Plugin Definition

Your main plugin definition is the entry point to your plugin. It must export a function that takes in the Rivet core library as its only argument. This function is called when the plugin is loaded, and is passed the Rivet core library as an argument.

The type for the function is called `RivetPluginInitializer` and is defined roughly as follows:

```ts
import * as Rivet from '@ironclad/rivet-core';
export type RivetPluginInitializer = (rivet: typeof Rivet) => RivetPlugin;
```

It must return a valid `RivetPlugin` instance. A `RivetPlugin` is defined as follows:

```ts
export type RivetPlugin = {
  /** The unique identifier of the plugin. Should be unique across all plugins. */
  id: string;

  /** The display name of the plugin - what is shown in the UI fr the plugin. */
  name?: string;

  /** Registers new nodes for the plugin to add. */
  register?: (register: <T extends ChartNode>(definition: PluginNodeDefinition<T>) => void) => void;

  /** The available configuration items and their specification, for configuring a plugin in the UI. */
  configSpec?: RivetPluginConfigSpecs;

  /** Defines additional context menu groups that the plugin adds. */
  contextMenuGroups?: Array<{
    id: string;
    label: string;
  }>;
};
```

- `id` is required. This must be a unique identifier for your plugin (across all plugins)
- `name` is optional but recommended - this is the display name of your plugin when it appears in the Rivet UI.
- `register` is where you register new nodes for your plugin. This is explained in more detail below.
- `configSpec` is where you define the configuration items for your plugin. This is explained in more detail below.
- `contextMenuGroups` allows you to add additinoal context menu groups to the right click menu in Rivet.

The following is the simplest possible TypeScript plugin definition:

```ts
import type { RivetPluginInitializer } from '@ironclad/rivet-core';

const plugin: RivetPluginInitializer = (rivet) => ({
  id: 'my-plugin',
  name: 'My Plugin',
});

export default plugin;
```

The following is the simplest possible JavaScript plugin definition:

```js
const plugin = (rivet) => ({
  id: 'my-plugin',
  name: 'My Plugin',
});

export default plugin;
```

### Registering Nodes

Nodes must also follow the rule that they must export a function that takes in the Rivet library as its only argument. To create an instance of the node, you call this function inside your plugin initializer function. For example, in TypeScript:

```ts
import type { RivetPlugin, RivetPluginInitializer } from '@ironclad/rivet-core';
import myNode from './nodes/myNode';

const plugin: RivetPluginInitializer = (rivet) => {
  const myPlugin: RivetPlugin = {
    id: 'my-plugin',
    name: 'My Plugin',
    register: (register) => {
      register(myNode(rivet));
    },
  };

  return myPlugin;
};
```

In JavaScript:

```js
import myNode from './nodes/myNode';

const plugin = (rivet) => ({
  id: 'my-plugin',
  name: 'My Plugin',
  register: (register) => {
    register(myNode(rivet));
  },
});
```

### Node Definitions

A node definition is a function that takes in the Rivet library as its only argument, and returns a `PluginNodeDefinition` object. This object is defined as follows:

```ts
export type PluginNodeDefinition<T extends ChartNode> = {
  impl: PluginNodeImpl<T>;
  displayName: string;
};

export interface PluginNodeImpl<T extends ChartNode> {
  getInputDefinitions(
    data: T['data'],
    connections: NodeConnection[],
    nodes: Record<NodeId, ChartNode>,
    project: Project,
  ): NodeInputDefinition[];

  getOutputDefinitions(
    data: T['data'],
    connections: NodeConnection[],
    nodes: Record<NodeId, ChartNode>,
    project: Project,
  ): NodeOutputDefinition[];

  process(data: T['data'], inputData: Inputs, context: InternalProcessContext): Promise<Outputs>;

  getEditors(data: T['data'], context: RivetUIContext): EditorDefinition<T>[] | Promise<EditorDefinition<T>[]>;

  getBody(data: T['data'], context: RivetUIContext): NodeBody | Promise<NodeBody>;

  create(): T;

  getUIData(context: RivetUIContext): NodeUIData | Promise<NodeUIData>;
}
```

A valid plugin node definition can be created using the `pluginNodeDefinition` function. For example:

```ts
import type { Rivet } from '@ironclad/rivet-core';

export function myExamplePlugin(rivet: typeof Rivet) {
  return rivet.pluginNodeDefinition({
    displayName: 'My Example Plugin',
    impl: {
      getInputDefinitions: () => [],
      getOutputDefinitions: () => [],
      process: async () => ({}),
      getEditors: () => [],
      getBody: () => ({ type: 'text', text: 'Hello World' }),
      create: () => ({ data: {} }),
      getUIData: () => ({}),
    },
  });
}
```

The following node implementation object is taken from the [rivet-plugin-example](https://github.com/abrenneke/rivet-plugin-example/blob/main/src/nodes/ExamplePluginNode.ts) project. This should be used as your starting point for creating new nodes:

```ts
// **** IMPORTANT ****
// Make sure you do `import type` and do not pull in the entire Rivet core library here.
// Export a function that takes in a Rivet object, and you can access rivet library functionality
// from there.
import type {
  ChartNode,
  EditorDefinition,
  Inputs,
  InternalProcessContext,
  NodeBodySpec,
  NodeConnection,
  NodeId,
  NodeInputDefinition,
  NodeOutputDefinition,
  NodeUIData,
  Outputs,
  PluginNodeImpl,
  PortId,
  Project,
  Rivet,
} from '@ironclad/rivet-core';

// This defines your new type of node.
export type ExamplePluginNode = ChartNode<'examplePlugin', ExamplePluginNodeData>;

// This defines the data that your new node will store.
export type ExamplePluginNodeData = {
  someData: string;

  // It is a good idea to include useXInput fields for any inputs you have, so that
  // the user can toggle whether or not to use an import port for them.
  useSomeDataInput?: boolean;
};

// Make sure you export functions that take in the Rivet library, so that you do not
// import the entire Rivet core library in your plugin.
export function examplePluginNode(rivet: typeof Rivet) {
  // This is your main node implementation. It is an object that implements the PluginNodeImpl interface.
  const ExamplePluginNodeImpl: PluginNodeImpl<ExamplePluginNode> = {
    // This should create a new instance of your node type from scratch.
    create(): ExamplePluginNode {
      const node: ExamplePluginNode = {
        // Use rivet.newId to generate new IDs for your nodes.
        id: rivet.newId<NodeId>(),

        // This is the default data that your node will store
        data: {
          someData: 'Hello World',
        },

        // This is the default title of your node.
        title: 'Example Plugin Node',

        // This must match the type of your node.
        type: 'examplePlugin',

        // X and Y should be set to 0. Width should be set to a reasonable number so there is no overflow.
        visualData: {
          x: 0,
          y: 0,
          width: 200,
        },
      };
      return node;
    },

    // This function should return all input ports for your node, given its data, connections, all other nodes, and the project. The
    // connection, nodes, and project are for advanced use-cases and can usually be ignored.
    getInputDefinitions(
      data: ExamplePluginNodeData,
      _connections: NodeConnection[],
      _nodes: Record<NodeId, ChartNode>,
      _project: Project,
    ): NodeInputDefinition[] {
      const inputs: NodeInputDefinition[] = [];

      if (data.useSomeDataInput) {
        inputs.push({
          id: 'someData' as PortId,
          dataType: 'string',
          title: 'Some Data',
        });
      }

      return inputs;
    },

    // This function should return all output ports for your node, given its data, connections, all other nodes, and the project. The
    // connection, nodes, and project are for advanced use-cases and can usually be ignored.
    getOutputDefinitions(
      _data: ExamplePluginNodeData,
      _connections: NodeConnection[],
      _nodes: Record<NodeId, ChartNode>,
      _project: Project,
    ): NodeOutputDefinition[] {
      return [
        {
          id: 'someData' as PortId,
          dataType: 'string',
          title: 'Some Data',
        },
      ];
    },

    // This returns UI information for your node, such as how it appears in the context menu.
    getUIData(): NodeUIData {
      return {
        contextMenuTitle: 'Example Plugin',
        group: 'Example',
        infoBoxBody: 'This is an example plugin node.',
        infoBoxTitle: 'Example Plugin Node',
      };
    },

    // This function defines all editors that appear when you edit your node.
    getEditors(_data: ExamplePluginNodeData): EditorDefinition<ExamplePluginNode>[] {
      return [
        {
          type: 'string',
          dataKey: 'someData',
          useInputToggleDataKey: 'useSomeDataInput',
          label: 'Some Data',
        },
      ];
    },

    // This function returns the body of the node when it is rendered on the graph. You should show
    // what the current data of the node is in some way that is useful at a glance.
    getBody(data: ExamplePluginNodeData): string | NodeBodySpec | NodeBodySpec[] | undefined {
      return rivet.dedent`
        Example Plugin Node
        Data: ${data.useSomeDataInput ? '(Using Input)' : data.someData}
      `;
    },

    // This is the main processing function for your node. It can do whatever you like, but it must return
    // a valid Outputs object, which is a map of port IDs to DataValue objects. The return value of this function
    // must also correspond to the output definitions you defined in the getOutputDefinitions function.
    async process(data: ExamplePluginNodeData, inputData: Inputs, _context: InternalProcessContext): Promise<Outputs> {
      const someData = rivet.getInputOrData(data, inputData, 'someData', 'string');

      return {
        ['someData' as PortId]: {
          type: 'string',
          value: someData,
        },
      };
    },
  };

  // Once a node is defined, you must pass it to rivet.pluginNodeDefinition, which will return a valid
  // PluginNodeDefinition object.
  const examplePluginNode = rivet.pluginNodeDefinition(ExamplePluginNodeImpl, 'Example Plugin Node');

  // This definition should then be used in the `register` function of your plugin definition.
  return examplePluginNode;
}
```

Again, it is important that node definitions export a function that takes in `Rivet` as their only argument, so that the Rivet library can be dynamicalled injected into the plugin.

### Node.js Code

See the code and readme in the [rivet-plugin-example-python-exec](https://github.com/abrenneke/rivet-plugin-example-python-exec] project for an example of how to write a node.js plugin.

### Configuration

A plugin can define configuration settings, so that you can configure a plugin in Rivet's Settings menu. In here, you can configure things such as API keys, or other global settings specific to your plugin.

To define configuration settings, you must define a `configSpec` object in your plugin definition. This object is defined as follows:

```ts
export type RivetPluginConfigSpecs = Record<string, PluginConfigurationSpec>;

export type PluginConfigurationSpecBase<T> = {
  /** The type of the config value, how it should show as an editor in the UI. */
  type: string;

  /** The default value of the config item if unset. */
  default?: T;

  /** A description to show in the UI for the config setting. */
  description?: string;

  /** The label of the setting in the UI. */
  label: string;
};

export type StringPluginConfigurationSpec = {
  type: 'string';
  default?: string;
  label: string;
  description?: string;
  pullEnvironmentVariable?: true | string;
  helperText?: string;
};

export type SecretPluginConfigurationSpec = {
  type: 'secret';
  default?: string;
  label: string;
  description?: string;
  pullEnvironmentVariable?: true | string;
  helperText?: string;
};

export type PluginConfigurationSpec =
  | StringPluginConfigurationSpec
  | SecretPluginConfigurationSpec
  | PluginConfigurationSpecBase<number>
  | PluginConfigurationSpecBase<boolean>;
```

The keys of your `configSpec` object are the names of the configuration items. The values are objects that define the configuration item. The following is an example of a plugin definition with configuration items:

```ts
import type { RivetPluginInitializer, RivetPlugin } from '@ironclad/rivet-core';

const plugin: RivetPluginInitializer = (rivet) => {
  const myPlugin: RivetPlugin = {
    id: 'my-plugin',
    name: 'My Plugin',
    configSpec: {
      apiKey: {
        type: 'secret',
        label: 'API Key',
        description: 'The API key to use for this plugin',
      },
      someSetting: {
        type: 'string',
        label: 'Some Setting',
        description: 'Some setting for this plugin',
      },
      someOtherSetting: {
        type: 'number',
        label: 'Some Other Setting',
        description: 'Some other setting for this plugin',
      },
      someBooleanSetting: {
        type: 'boolean',
        label: 'Some Boolean Setting',
        description: 'Some boolean setting for this plugin',
      },
    },
  };

  return myPlugin;
};
```

### Reading Configuration Items

The third argument to the `process` method of a node is the `InternalProcessContext`. This object contains a `getPluginConfig` method that can be used to read the configuration items for a plugin. For example:

```ts
import type { RivetPluginInitializer, RivetPlugin } from '@ironclad/rivet-core';

const plugin: RivetPluginInitializer = (rivet) => {
  const myPlugin: RivetPlugin = {
    id: 'my-plugin',
    name: 'My Plugin',
    configSpec: {
      apiKey: {
        type: 'secret',
        label: 'API Key',
        description: 'The API key to use for this plugin',
      },
    },
    register: (register) => {
      register(
        rivet.pluginNodeDefinition({
          displayName: 'My Example Plugin',
          impl: {
            ...etc,
            process: async (_data, _inputData, context) => {
              const apiKey = context.getPluginConfig('apiKey');
              // Do something with the API key
            },
          },
        }),
      );
    },
  };

  return myPlugin;
};
```

## Developing Plugins

The recommended way to develop plugins is do create your repository inside the plugins directory of Rivet. This way, when you rebuild your plugin, you only need to restart Rivet to see the changes.

:::tip

Your rivet plugins directory is shown at the bottom of the Plugins overlay in Rivet, accessible via the Plugins tab at the top of the screen.

:::

To do this,

1. Create a directory called `<plugin-name>-latest` inside the plugins directory for Rivet.
2. Clone your repository into a folder called `package` inside this directory. For example, `git clone <my-repo-url> package`. You may also create a `package` directory, and copy your repository into it.
3. Your final path should contain `plugins/<plugin-name>-latest/package/.git`. It is important to include the `.git` folder, as this is how Rivet knows that your plugin is locally installed.
4. Use `Add NPM Plugin` in rivet, and pass in `<plugin-name>` as the package name. This will install your plugin from the local directory.
5. If you are using the example plugins, you can run `yarn dev` in the `package` folder to automatically watch for changes and rebuild your plugin. Then, you only need to restart Rivet on each change in order to see your changes in Rivet.

## Further Help

For more help, join the [Rivet Discord](https://discord.gg/qT8B2gv9Mg), we're happy to help with your plugin development!
