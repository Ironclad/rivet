import {
  type ChartNode,
  type NodeId,
  type NodeInputDefinition,
  type NodeOutputDefinition,
  type PortId,
} from '../NodeBase.js';
import { nanoid } from 'nanoid/non-secure';
import { NodeImpl, type NodeUIData } from '../NodeImpl.js';
import { nodeDefinition } from '../NodeDefinition.js';
import { type Inputs, type Outputs } from '../GraphProcessor.js';
import { type EditorDefinition } from '../../index.js';
import { match } from 'ts-pattern';
import { dedent } from 'ts-dedent';
import { coerceType, coerceTypeOptional } from '../../utils/coerceType.js';

export type EvaluateNode = ChartNode<'evaluate', EvaluateNodeData>;

export type EvaluateNodeData = {
  operation: '+' | '-' | '*' | '/' | '^' | '%' | 'abs' | 'negate';
  useOperationInput?: boolean;
};

const unaryOperation = ['abs', 'negate'] as const;
type Unary = (typeof unaryOperation)[number];
const isUnaryOp = (operation: string): operation is Unary => unaryOperation.includes(operation as Unary);

export class EvaluateNodeImpl extends NodeImpl<EvaluateNode> {
  static create(): EvaluateNode {
    const chartNode: EvaluateNode = {
      type: 'evaluate',
      title: 'Evaluate',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 175,
      },
      data: {
        operation: '+',
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    const inputs: NodeInputDefinition[] = [
      {
        dataType: 'number',
        id: 'a' as PortId,
        title: 'A',
      },
    ];

    const isUnary = !this.data.useOperationInput && isUnaryOp(this.data.operation);

    if (!isUnary) {
      inputs.push({
        dataType: 'number',
        id: 'b' as PortId,
        title: 'B',
      });
    }

    if (this.data.useOperationInput) {
      inputs.push({
        dataType: 'string',
        id: 'operation' as PortId,
        title: 'Operation',
      });
    }

    return inputs;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        dataType: 'number',
        id: 'output' as PortId,
        title: 'Output',
      },
    ];
  }

  getEditors(): EditorDefinition<EvaluateNode>[] {
    return [
      {
        type: 'dropdown',
        label: 'Operation',
        dataKey: 'operation',
        options: [
          { label: '+', value: '+' },
          { label: '-', value: '-' },
          { label: '*', value: '*' },
          { label: '/', value: '/' },
          { label: '^', value: '^' },
          { label: '%', value: '%' },
          { label: 'abs', value: 'abs' },
          { label: 'negate', value: 'negate' },
        ],
        useInputToggleDataKey: 'useOperationInput',
      },
    ];
  }

  getBody(): string | undefined {
    const isUnary = !this.data.useOperationInput && isUnaryOp(this.data.operation);

    if (isUnary) {
      return match(this.data.operation as Unary)
        .with('abs', () => 'abs(A)')
        .with('negate', () => '-A')
        .exhaustive();
    }

    if (this.data.operation === '^') {
      return '!markdownA<sup>B</sup>';
    }

    return this.data.useOperationInput ? 'A (Operation) B' : `A ${this.data.operation} B`;
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Evaluates the configured mathematical operation on the input values and outputs the result.

        For more complex operations, you should use the \`Code\` node.
      `,
      infoBoxTitle: 'Evaluate Node',
      contextMenuTitle: 'Evaluate',
      group: ['Numbers'],
    };
  }

  async process(inputs: Inputs): Promise<Outputs> {
    const operation = (
      this.data.useOperationInput ? coerceType(inputs['operation' as PortId], 'string') : this.data.operation
    ) as EvaluateNodeData['operation'];

    const inputA = coerceTypeOptional(inputs['a' as PortId], 'number');
    const inputB = coerceTypeOptional(inputs['b' as PortId], 'number');

    if (isUnaryOp(operation) && inputA) {
      return {
        ['output' as PortId]: {
          type: 'number',
          value: match(operation as Extract<EvaluateNodeData['operation'], Unary>)
            .with('abs', () => Math.abs(inputA))
            .with('negate', () => -inputA)
            .exhaustive(),
        },
      };
    }

    if (inputA == null || inputB == null) {
      throw new Error('Missing input');
    }

    return {
      ['output' as PortId]: {
        type: 'number',
        value: match(operation as Exclude<EvaluateNodeData['operation'], Unary>)
          .with('+', () => inputA + inputB)
          .with('-', () => inputA - inputB)
          .with('*', () => inputA * inputB)
          .with('/', () => inputA / inputB)
          .with('^', () => Math.pow(inputA, inputB))
          .with('%', () => inputA % inputB)
          .exhaustive(),
      },
    };
  }
}

export const evaluateNode = nodeDefinition(EvaluateNodeImpl, 'Evaluate');
