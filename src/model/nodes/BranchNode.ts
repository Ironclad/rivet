import { NodeImpl } from '../NodeImpl';
import { ChartNode, NodeId, NodeInputDefinition, NodeInputId, NodeOutputDefinition, NodeOutputId } from '../NodeBase';
import { nanoid } from 'nanoid';

type BranchNodeData = {
  condition: string;
};

export type BranchNode = ChartNode<'branch', BranchNodeData>;

export class BranchNodeImpl extends NodeImpl<BranchNode> {
  static create(): BranchNode {
    const inputDefinitions: NodeInputDefinition[] = [
      {
        dataType: 'string',
        id: 'input_1' as NodeInputId,
        title: 'Condition',
      },
      {
        dataType: 'string',
        id: 'input_2' as NodeInputId,
        title: 'True',
      },
      {
        dataType: 'string',
        id: 'input_3' as NodeInputId,
        title: 'False',
      },
    ];

    const outputDefinitions: NodeOutputDefinition[] = [
      {
        dataType: 'string',
        id: 'output_true' as NodeOutputId,
        title: 'True',
      },
      {
        dataType: 'string',
        id: 'output_false' as NodeOutputId,
        title: 'False',
      },
    ];

    const chartNode: BranchNode = {
      type: 'branch',
      title: 'Branch',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
      },
      data: {
        condition: '',
      },
      inputDefinitions: inputDefinitions,
      outputDefinitions: outputDefinitions,
    };

    return chartNode;
  }

  process(inputs: Record<string, any>): Record<string, any> {
    const condition = inputs['input_1'];
    const trueOutput = inputs['input_2'];
    const falseOutput = inputs['input_3'];

    const conditionResult = eval(condition);

    if (conditionResult) {
      return {
        output_true: trueOutput,
      };
    } else {
      return {
        output_false: falseOutput,
      };
    }
  }
}
