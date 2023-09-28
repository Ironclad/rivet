import type { Inputs, Outputs } from './GraphProcessor.js';
import type { ChartNode, NodeConnection, NodeId, NodeInputDefinition, NodeOutputDefinition } from './NodeBase.js';
import type { Project } from './Project.js';
import type { InternalProcessContext } from './ProcessContext.js';
import type { EditorDefinition } from './EditorDefinition.js';
import type { NodeBodySpec } from './NodeBodySpec.js';
import type { RivetUIContext } from './RivetUIContext.js';

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

  getEditors(_context: RivetUIContext): EditorDefinition<T>[] | Promise<EditorDefinition<T>[]> {
    return [];
  }

  getBody(_context: RivetUIContext): NodeBody | Promise<NodeBody> {
    return undefined;
  }
}

export type NodeBody = string | NodeBodySpec | NodeBodySpec[] | undefined;

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

  getEditors(context: RivetUIContext): EditorDefinition<T>[] | Promise<EditorDefinition<T>[]> {
    return this.impl.getEditors(this.data, context);
  }

  getBody(context: RivetUIContext): NodeBody | Promise<NodeBody> {
    return this.impl.getBody(this.data, context);
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

  getUIData(context: RivetUIContext): NodeUIData | Promise<NodeUIData>;
};
