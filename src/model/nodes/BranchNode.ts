import { NodeImpl } from '../NodeImpl';
import { ChartNode, NodeId, NodeInputDefinition, NodeOutputDefinition, PortId } from '../NodeBase';
import { nanoid } from 'nanoid';
import { DataValue } from '../DataValue';

type BranchNodeData = {
  condition: string;
};

export type BranchNode = ChartNode<'branch', BranchNodeData>;

export class BranchNodeImpl extends NodeImpl<BranchNode> {
  static create(): BranchNode {
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
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    return [
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
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
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
  }

  async process(inputs: Record<string, DataValue>): Promise<Record<string, DataValue>> {
    const condition = inputs['input_1'];
    const trueOutput = inputs['input_2'];
    const falseOutput = inputs['input_3'];

    if (condition.type !== 'string') {
      throw new Error('Condition must be a string');
    }

    const conditionResult = eval(condition.value);

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
