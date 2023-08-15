import { Inputs, Outputs } from './GraphProcessor.js';
import { ChartNode, NodeConnection, NodeId, NodeInputDefinition, NodeOutputDefinition } from './NodeBase.js';
import { Project } from './Project.js';
import { InternalProcessContext } from './ProcessContext.js';
import { EditorDefinition } from './EditorDefinition.js';
import { NodeBodySpec } from './NodeBodySpec.js';

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

  getEditors(): EditorDefinition<T>[] {
    return [];
  }

  getBody(): string | NodeBodySpec | NodeBodySpec[] | undefined {
    return undefined;
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
  new (chartNode: T): NodeImpl<T>;

  create(): T;

  getUIData(): NodeUIData;
};

export type NodeDefinition<T extends ChartNode> = {
  impl: NodeImplConstructor<T>;
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
