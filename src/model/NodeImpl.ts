import { Settings } from '../state/settings';
import { DataValue } from './DataValue';
import { ChartNode, NodeConnection, NodeInputDefinition, NodeOutputDefinition } from './NodeBase';
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

  abstract getInputDefinitions(connections: NodeConnection[]): NodeInputDefinition[];

  abstract getOutputDefinitions(connections: NodeConnection[]): NodeOutputDefinition[];

  abstract process(inputData: Record<string, DataValue>, context: ProcessContext): Promise<Record<string, DataValue>>;
}

export type ProcessContext = {
  settings: Settings;
  nativeApi: NativeApi;
};
