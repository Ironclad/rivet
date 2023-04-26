import { ChartNode, NodeId } from '../../model/NodeBase';
import { NodeImpl, ProcessContext } from '../../model/NodeImpl';
import { NodeInputDefinition, NodeOutputDefinition, PortId } from '../../model/NodeBase';
import { DataValue, expectType } from '../../model/DataValue';
import { SupportedModels, chunkStringByTokenCount, modelToTiktokenModel } from '../../utils/tokenizer';
import { nanoid } from 'nanoid';

export type ChunkNodeData = {
  numTokensPerChunk: number;

  model: string;
  useModelInput: boolean;

  overlap: number;
};

export type ChunkNode = ChartNode<'chunk', ChunkNodeData>;

export class ChunkNodeImpl extends NodeImpl<ChunkNode> {
  static create() {
    const chartNode: ChunkNode = {
      type: 'chunk',
      title: 'Chunk',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 200,
      },
      data: {
        model: 'gpt-3.5-turbo',
        useModelInput: false,
        numTokensPerChunk: 1024,
        overlap: 0,
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    return [
      {
        id: 'input' as PortId,
        title: 'Input',
        dataType: 'string',
      },
    ];
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'chunks' as PortId,
        title: 'Chunks',
        dataType: 'string[]',
      },
      {
        id: 'indexes' as PortId,
        title: 'Indexes',
        dataType: 'number[]',
      },
      {
        id: 'count' as PortId,
        title: 'Count',
        dataType: 'number',
      },
    ];
  }

  async process(inputs: Record<PortId, DataValue>, context: ProcessContext): Promise<Record<PortId, DataValue>> {
    const input = expectType(inputs['input' as PortId], 'string');

    const overlapPercent = this.chartNode.data.overlap / 100;

    const chunked = chunkStringByTokenCount(
      input,
      this.chartNode.data.numTokensPerChunk,
      modelToTiktokenModel[this.chartNode.data.model as SupportedModels],
      overlapPercent,
    );
    return {
      ['chunks' as PortId]: {
        type: 'string[]',
        value: chunked,
      },
      ['indexes' as PortId]: {
        type: 'number[]',
        value: chunked.map((_, i) => i + 1),
      },
      ['count' as PortId]: {
        type: 'number',
        value: chunked.length,
      },
    };
  }
}
