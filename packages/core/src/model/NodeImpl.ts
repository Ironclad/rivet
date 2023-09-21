import { Inputs, Outputs } from './GraphProcessor.js';
import { ChartNode, NodeConnection, NodeId, NodeInputDefinition, NodeOutputDefinition } from './NodeBase.js';
import { Project } from './Project.js';
import { InternalProcessContext } from './ProcessContext.js';
import { EditorDefinition, GetEditorsReturnType } from './EditorDefinition.js';
import { NodeBodySpec } from './NodeBodySpec.js';

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

  getEditors(data: T['data']): GetEditorsReturnType<T>;

  getBody(data: T['data']): string | NodeBodySpec | NodeBodySpec[] | undefined;

  create(): T;

  getUIData(): NodeUIData;
}

export abstract class NodeImpl<T extends ChartNode, Type extends T['type'] = T['type']> {
  readonly chartNode: T;

  constructor(chartNode: T) {
    this.chartNode = chartNode;
  }

  get id(): string {
    return this.chartNode.id;
  }

  get type(): Type {
    return this.chartNode.type as Type;
  }

  get title(): string {
    return this.chartNode.title;
  }

  get visualData(): { x: number; y: number } {
    return this.chartNode.visualData;
  }

  get data(): T['data'] {
    return this.chartNode.data;
  }

  abstract getInputDefinitions(
    connections: NodeConnection[],
    nodes: Record<NodeId, ChartNode>,
    project: Project,
  ): NodeInputDefinition[];

  abstract getOutputDefinitions(
    connections: NodeConnection[],
    nodes: Record<NodeId, ChartNode>,
    project: Project,
  ): NodeOutputDefinition[];

  abstract process(inputData: Inputs, context: InternalProcessContext): Promise<Outputs>;

  getEditors(): GetEditorsReturnType<T> {
    return [];
  }

  getBody(): string | NodeBodySpec | NodeBodySpec[] | undefined {
    return undefined;
  }
}

export class PluginNodeImplClass<T extends ChartNode, Type extends T['type'] = T['type']> extends NodeImpl<T, Type> {
  readonly impl: PluginNodeImpl<T>;

  constructor(chartNode: T, impl: PluginNodeImpl<T>) {
    super(chartNode);
    this.impl = impl;
  }

  getInputDefinitions(
    connections: NodeConnection[],
    nodes: Record<NodeId, ChartNode>,
    project: Project,
  ): NodeInputDefinition[] {
    return this.impl.getInputDefinitions(this.data, connections, nodes, project);
  }

  getOutputDefinitions(
    connections: NodeConnection[],
    nodes: Record<NodeId, ChartNode>,
    project: Project,
  ): NodeOutputDefinition[] {
    return this.impl.getOutputDefinitions(this.data, connections, nodes, project);
  }

  process(inputData: Inputs, context: InternalProcessContext): Promise<Outputs> {
    return this.impl.process(this.data, inputData, context);
  }

  getEditors(): GetEditorsReturnType<T> {
    return this.impl.getEditors(this.data);
  }

  getBody(): string | NodeBodySpec | NodeBodySpec[] | undefined {
    return this.impl.getBody(this.data);
  }
}

export type NodeUIData = {
  contextMenuTitle?: string;
  infoBoxTitle?: string;
  infoBoxBody?: string;
  infoBoxImageUri?: string;
  group?: string | string[];
};

export type NodeImplConstructor<T extends ChartNode> = {
  new (chartNode: T, pluginImpl: PluginNodeImpl<T> | undefined): NodeImpl<T>;

  create(pluginImpl?: PluginNodeImpl<T>): T;

  getUIData(pluginImpl?: PluginNodeImpl<T>): NodeUIData;
};

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
