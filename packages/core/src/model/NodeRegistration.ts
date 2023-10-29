import { type ChartNode, type NodeImplConstructor, type NodeImpl, type PluginNodeImpl } from '../index.js';
import { mapValues, values } from '../utils/typeSafety.js';
import type { NodeDefinition, PluginNodeDefinition } from './NodeDefinition.js';
import { type RivetPlugin } from './RivetPlugin.js';
import { type RivetUIContext } from './RivetUIContext.js';
import { PluginNodeImplClass } from './NodeImpl.js';

export class NodeRegistration<NodeTypes extends string = never, Nodes extends ChartNode = never> {
  NodesType: Nodes = undefined!;
  NodeTypesType: NodeTypes = undefined!;

  #infos = {} as {
    [P in NodeTypes]: {
      displayName: string;
      impl: NodeImplConstructor<Extract<Nodes, { type: P }>>;
      plugin?: RivetPlugin;
      pluginImpl?: PluginNodeImpl<Extract<Nodes, { type: P }>>;
    };
  };

  readonly #plugins = [] as RivetPlugin[];

  #implsMap = {} as Record<string, { impl: NodeImplConstructor<ChartNode>; pluginImpl?: PluginNodeImpl<ChartNode> }>;
  readonly #nodeTypes = [] as NodeTypes[];

  register<T extends ChartNode>(
    definition: NodeDefinition<T>,
    plugin?: RivetPlugin,
  ): NodeRegistration<NodeTypes | T['type'], Nodes | T> {
    const newRegistration = this as NodeRegistration<NodeTypes | T['type'], Nodes | T>;

    const typeStr = definition.impl.create(undefined).type as T['type'];

    if (newRegistration.#infos[typeStr]) {
      throw new Error(`Duplicate node type: ${typeStr}`);
    }

    newRegistration.#infos[typeStr] = {
      displayName: definition.displayName,
      impl: definition.impl as any,
      plugin,
    };

    newRegistration.#implsMap[typeStr] = {
      impl: definition.impl as any,
      pluginImpl: undefined,
    };

    newRegistration.#nodeTypes.push(typeStr);

    return newRegistration;
  }

  registerPluginNode<T extends ChartNode>(
    definition: PluginNodeDefinition<T>,
    plugin: RivetPlugin,
  ): NodeRegistration<NodeTypes | T['type'], Nodes | T> {
    const newRegistration = this as NodeRegistration<NodeTypes | T['type'], Nodes | T>;

    const typeStr = definition.impl.create().type as T['type'];

    if (newRegistration.#infos[typeStr]) {
      throw new Error(`Duplicate node type: ${typeStr}`);
    }

    const pluginClass = class extends PluginNodeImplClass<T> {
      static create() {
        return definition.impl.create();
      }

      static getUIData(context: RivetUIContext) {
        return definition.impl.getUIData(context);
      }
    };

    newRegistration.#infos[typeStr] = {
      displayName: definition.displayName,
      impl: pluginClass as any,
      plugin,
      pluginImpl: definition.impl as any,
    };

    newRegistration.#implsMap[typeStr] = {
      impl: pluginClass as any,
      pluginImpl: definition.impl as any,
    };

    newRegistration.#nodeTypes.push(typeStr);

    return newRegistration;
  }

  get #dynamicImpls(): Record<
    string,
    { impl: NodeImplConstructor<ChartNode>; pluginImpl?: PluginNodeImpl<ChartNode> }
  > {
    return this.#implsMap;
  }

  get #dynamicDisplayNames(): Record<string, string> {
    const displayNameMap = mapValues(this.#infos, (info) => info.displayName);
    return displayNameMap as Record<string, string>;
  }

  registerPlugin(plugin: RivetPlugin) {
    if (plugin.register) {
      plugin.register((definition) => this.registerPluginNode(definition, plugin));
    }
    this.#plugins.push(plugin);
  }

  create<T extends NodeTypes>(type: T): Extract<Nodes, { type: T }> {
    const info = this.#infos[type];
    if (!info) {
      throw new Error(`Unknown node type: ${type}`);
    }

    return info.impl.create(info.pluginImpl) as unknown as Extract<Nodes, { type: T }>;
  }

  createDynamic(type: string): ChartNode {
    const implClass = this.#dynamicImpls[type];
    if (!implClass) {
      throw new Error(`Unknown node type: ${type}`);
    }
    return implClass.impl.create(implClass.pluginImpl);
  }

  createImpl<T extends Nodes>(node: T): NodeImpl<T> {
    const type = node.type as Extract<NodeTypes, T['type']>;

    const info = this.#infos[type];

    if (!info) {
      throw new Error(`Unknown node type: ${type}`);
    }

    const { impl: ImplClass, pluginImpl } = info;

    const impl = new ImplClass(node as any, pluginImpl) as unknown as NodeImpl<T>;
    if (!impl) {
      throw new Error(`Unknown node type: ${type}`);
    }

    return impl;
  }

  createDynamicImpl(node: ChartNode): NodeImpl<ChartNode> {
    const { type } = node;
    const ImplClass = this.#dynamicImpls[type];

    if (!ImplClass) {
      throw new Error(`Unknown node type: ${type}`);
    }

    // eslint-disable-next-line new-cap
    const impl = new ImplClass.impl(node, ImplClass.pluginImpl) as unknown as NodeImpl<ChartNode>;
    if (!impl) {
      throw new Error(`Unknown node type: ${type}`);
    }

    return impl;
  }

  getDisplayName<T extends NodeTypes>(type: T): string {
    const info = this.#infos[type];

    if (!info) {
      throw new Error(`Unknown node type: ${type}`);
    }

    return info.displayName;
  }

  getDynamicDisplayName(type: string) {
    const displayName = this.#dynamicDisplayNames[type];
    if (!displayName) {
      throw new Error(`Unknown node type: ${type}`);
    }

    return displayName;
  }

  isRegistered(type: NodeTypes): boolean {
    return this.#infos[type] !== undefined;
  }

  getNodeTypes(): NodeTypes[] {
    return this.#nodeTypes;
  }

  getNodeConstructors(): NodeImplConstructor<ChartNode>[] {
    return values(this.#dynamicImpls).map((info) => info.impl);
  }

  getPluginFor(type: string): RivetPlugin | undefined {
    const info = this.#infos[type as NodeTypes];

    if (!info) {
      throw new Error(`Unknown node type: ${type}`);
    }

    return info.plugin;
  }

  getPlugins() {
    return this.#plugins;
  }
}
