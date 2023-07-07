import { ChartNode, NodeImplConstructor, NodeDefinition, NodeImpl } from '../index.js';

export class NodeRegistration<
  NodeTypes extends string = never,
  Nodes extends ChartNode = never,
  Impls extends {
    [P in NodeTypes]: NodeImplConstructor<Extract<Nodes, { type: P }>>;
  } = never,
> {
  NodesType: Nodes = undefined!;
  NodeTypesType: NodeTypes = undefined!;

  #impls = {} as Impls;
  #displayNames = {} as Record<NodeTypes, string>;

  register<T extends ChartNode>(
    definition: NodeDefinition<T>,
  ): NodeRegistration<
    NodeTypes | T['type'],
    Nodes | T,
    {
      [P in NodeTypes | T['type']]: NodeImplConstructor<Extract<Nodes | T, { type: P }>>;
    }
  > {
    const newRegistration = this as NodeRegistration<
      NodeTypes | T['type'],
      Nodes | T,
      {
        [P in NodeTypes | T['type']]: NodeImplConstructor<Extract<Nodes | T, { type: P }>>;
      }
    >;

    const typeStr = definition.impl.create().type as T['type'];
    newRegistration.#impls[typeStr] = definition.impl as any;
    newRegistration.#displayNames[typeStr] = definition.displayName;

    return newRegistration;
  }

  create<T extends NodeTypes>(type: T): Extract<Nodes, { type: T }> {
    const implClass = this.#impls[type];
    if (!implClass) {
      throw new Error(`Unknown node type: ${type}`);
    }

    return implClass.create() as unknown as Extract<Nodes, { type: T }>;
  }

  createImpl<T extends Nodes>(node: T): NodeImpl<T> {
    const type = node.type as Extract<NodeTypes, T['type']>;

    const ImplClass = this.#impls[type];

    if (!ImplClass) {
      throw new Error(`Unknown node type: ${type}`);
    }

    const impl = new ImplClass(node as any) as unknown as NodeImpl<T>;
    if (!impl) {
      throw new Error(`Unknown node type: ${type}`);
    }

    return impl;
  }

  getDisplayName<T extends NodeTypes>(type: T): string {
    return this.#displayNames[type];
  }

  isRegistered(type: NodeTypes): boolean {
    return this.#impls[type] !== undefined;
  }
}
