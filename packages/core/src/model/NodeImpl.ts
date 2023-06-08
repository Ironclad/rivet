import { Inputs, Outputs } from './GraphProcessor';
import { ChartNode, NodeConnection, NodeId, NodeInputDefinition, NodeOutputDefinition } from './NodeBase';
import { Project } from './Project';
import { InternalProcessContext } from './ProcessContext';
import { DataType } from '..';

export interface Settings {
  openAiKey: string;
  openAiOrganization?: string;

  pineconeApiKey?: string;
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

  getEditors(): EditorDefinition<T>[] {
    return [];
  }
}

export type NodeImplConstructor<T extends ChartNode> = {
  new (chartNode: T): NodeImpl<T>;

  create(): T;
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

type ExcludeNeverValues<T> = Pick<
  T,
  {
    [K in keyof T]: T[K] extends never ? never : K;
  }[keyof T]
>;

type DataOfType<T extends ChartNode, Type> = keyof ExcludeNeverValues<{
  [P in keyof T['data']]-?: NonNullable<T['data'][P]> extends Type ? T['data'][P] : never;
}>;

export type StringEditorDefinition<T extends ChartNode> = {
  type: 'string';
  label: string;

  dataKey: DataOfType<T, string>;
  useInputToggleDataKey?: DataOfType<T, boolean>;
};

export type ToggleEditorDefinition<T extends ChartNode> = {
  type: 'toggle';
  label: string;

  dataKey: DataOfType<T, boolean>;
  useInputToggleDataKey?: DataOfType<T, boolean>;
};

export type DataTypeSelectorEditorDefinition<T extends ChartNode> = {
  type: 'dataTypeSelector';
  label: string;

  dataKey: DataOfType<T, DataType>;
  useInputToggleDataKey?: DataOfType<T, boolean>;
};

export type AnyDataEditorDefinition<T extends ChartNode> = {
  type: 'anyData';
  label: string;

  dataKey: DataOfType<T, any>;
  useInputToggleDataKey?: DataOfType<T, boolean>;
};

export type DropdownEditorDefinition<T extends ChartNode> = {
  type: 'dropdown';
  label: string;

  dataKey: DataOfType<T, string>;
  options: {
    value: string;
    label: string;
  }[];

  useInputToggleDataKey?: DataOfType<T, boolean>;
};

export type NumberEditorDefinition<T extends ChartNode> = {
  type: 'number';
  label: string;

  dataKey: DataOfType<T, number>;
  defaultValue?: number;

  useInputToggleDataKey?: DataOfType<T, boolean>;

  min?: number;
  max?: number;
  step?: number;
};

export type CodeEditorDefinition<T extends ChartNode> = {
  type: 'code';
  label: string;

  dataKey: DataOfType<T, string>;
  useInputToggleDataKey?: DataOfType<T, boolean>;

  language: string;
  theme?: string;
};

export type EditorDefinition<T extends ChartNode> =
  | StringEditorDefinition<T>
  | ToggleEditorDefinition<T>
  | DataTypeSelectorEditorDefinition<T>
  | AnyDataEditorDefinition<T>
  | DropdownEditorDefinition<T>
  | NumberEditorDefinition<T>
  | CodeEditorDefinition<T>;
