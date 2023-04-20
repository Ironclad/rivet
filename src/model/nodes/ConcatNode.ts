import { NodeImpl } from '../NodeImpl';
import { ChartNode, NodeId, NodeInputDefinition, PortId, NodeOutputDefinition } from '../NodeBase';
import { nanoid } from 'nanoid';

export type ConcatNode = ChartNode<'concat', ConcatNodeData>;

export type ConcatNodeData = {
  inputStrings: string[];
};

export class ConcatNodeImpl extends NodeImpl<ConcatNode> {
  static create(inputStrings: string[] = ['a', 'b']): ConcatNode {
    const chartNode: ConcatNode = {
      type: 'concat',
      title: 'Concat',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
      },
      data: {
        inputStrings: inputStrings,
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    return this.chartNode.data.inputStrings.map((inputString, index) => {
      return {
        type: 'string',
        id: `input_${index}` as PortId,
        title: `Input ${inputString.toUpperCase()}`,
        dataType: 'string',
        required: false,
      };
    });
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'output' as PortId,
        title: 'Output',
        dataType: 'string',
      },
    ];
  }

  concatInputs(inputs: string[]): string {
    return inputs.join('');
  }

  process(inputs: Record<string, any>): Record<string, any> {
    const inputStrings = this.getInputDefinitions().map((input) => inputs[input.id]);
    const outputValue = this.concatInputs(inputStrings);
    return {
      output: outputValue,
    };
  }
}
