import { NodeImpl } from '../NodeImpl';
import { ChartNode, NodeId, NodeInputDefinition, NodeInputId, NodeOutputDefinition, NodeOutputId } from '../NodeBase';
import { nanoid } from 'nanoid';

export type ConcatNode = ChartNode<'concat', ConcatNodeData>;

export type ConcatNodeData = {
  inputStrings: string[];
};

export class ConcatNodeImpl extends NodeImpl<ConcatNode> {
  static create(inputStrings: string[] = ['a', 'b']): ConcatNode {
    const inputDefinitions: NodeInputDefinition[] = inputStrings.map((inputString, index) => {
      return {
        type: 'string',
        id: `input_${index}` as NodeInputId,
        title: `Input ${inputString.toUpperCase()}`,
        dataType: 'string',
        required: false,
      };
    });

    const outputDefinitions: NodeOutputDefinition[] = [
      {
        id: 'output' as NodeOutputId,
        title: 'Output',
        dataType: 'string',
      },
    ];

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
      inputDefinitions: inputDefinitions,
      outputDefinitions: outputDefinitions,
    };

    return chartNode;
  }

  concatInputs(inputs: string[]): string {
    return inputs.join('');
  }

  process(inputs: Record<string, any>): Record<string, any> {
    const inputStrings = this.inputDefinitions.map((input) => inputs[input.id]);
    const outputValue = this.concatInputs(inputStrings);
    return {
      output: outputValue,
    };
  }
}
