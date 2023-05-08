import { Settings } from '../state/settings';
import { DataValue } from './DataValue';
import { GraphProcessor } from './GraphProcessor';
import { ChartNode, NodeConnection, NodeInputDefinition, NodeOutputDefinition, PortId } from './NodeBase';
import { GraphId } from './NodeGraph';
import { Project } from './Project';
import { NativeApi } from './native/NativeApi';

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

  abstract getInputDefinitions(connections: NodeConnection[], project: Project): NodeInputDefinition[];

  abstract getOutputDefinitions(connections: NodeConnection[], project: Project): NodeOutputDefinition[];

  abstract process(
    inputData: Record<PortId, DataValue>,
    context: InternalProcessContext,
  ): Promise<Record<PortId, DataValue>>;
}

export type ProcessContext = {
  settings: Settings;
  nativeApi: NativeApi;
};

export type InternalProcessContext = ProcessContext & {
  project: Project;
  signal: AbortSignal;
  onPartialOutputs?: (outputs: Record<PortId, DataValue>) => void;
  createSubProcessor: (subGraphId: GraphId) => GraphProcessor;
};
