import { NodeImpl } from '../NodeImpl';
import { ChartNode, NodeId, NodeInputDefinition, NodeOutputDefinition, PortId } from '../NodeBase';
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
        id: 'input_1' as PortId,
        title: 'Condition',
      },
      {
        dataType: 'string',
        id: 'input_2' as PortId,
        title: 'On True',
      },
      {
        dataType: 'string',
        id: 'input_3' as PortId,
        title: 'On False',
      },
    ];

    const outputDefinitions: NodeOutputDefinition[] = [
      {
        dataType: 'string',
        id: 'output_true' as PortId,
        title: 'True',
      },
      {
        dataType: 'string',
        id: 'output_false' as PortId,
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
