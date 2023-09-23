import type { ChartNode } from './NodeBase.js';
import type { NodeImplConstructor, PluginNodeImpl } from './NodeImpl.js';

export type NodeDefinition<T extends ChartNode> = {
  impl: NodeImplConstructor<T>;
  displayName: string;
};

export type PluginNodeDefinition<T extends ChartNode> = {
  impl: PluginNodeImpl<T>;
  displayName: string;
};

export type UnknownNodeDefinition = NodeDefinition<ChartNode>;

export function nodeDefinition<T extends ChartNode>(
  impl: NodeImplConstructor<T>,
  displayName: string,
): NodeDefinition<T> {
  return {
    impl,
    displayName,
  };
}

export function pluginNodeDefinition<T extends ChartNode>(
  impl: PluginNodeImpl<T>,
  displayName: string,
): PluginNodeDefinition<T> {
  return {
    impl,
    displayName,
  };
}
