import { ChartNode, NodeId, NodeInputDefinition, NodeOutputDefinition, PortId } from '../NodeBase.js';
import { nanoid } from 'nanoid/non-secure';
import { NodeImpl, NodeUIData, nodeDefinition } from '../NodeImpl.js';
import { Inputs, Outputs } from '../GraphProcessor.js';
import { EditorDefinition, coerceType, coerceTypeOptional } from '../../index.js';
import { isEqual } from 'lodash-es';
import { match } from 'ts-pattern';
import { dedent } from 'ts-dedent';

export type CompareNode = ChartNode<'compare', CompareNodeData>;

export type CompareNodeData = {
  comparisonFunction: '==' | '<' | '>' | '<=' | '>=' | '!=';
  useComparisonFunctionInput?: boolean;
};

export class CompareNodeImpl extends NodeImpl<CompareNode> {
  static create(): CompareNode {
    const chartNode: CompareNode = {
      type: 'compare',
      title: 'Compare',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 160,
      },
      data: {
        comparisonFunction: '==',
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    const inputs: NodeInputDefinition[] = [
      {
        dataType: 'any',
        id: 'a' as PortId,
        title: 'A',
      },
      {
        dataType: 'any',
        id: 'b' as PortId,
        title: 'B',
      },
    ];

    if (this.data.useComparisonFunctionInput) {
      inputs.push({
        dataType: 'string',
        id: 'comparisonFunction' as PortId,
        title: 'Comparison Function',
      });
    }

    return inputs;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        dataType: 'boolean',
        id: 'output' as PortId,
        title: 'Output',
      },
    ];
  }

  getEditors(): EditorDefinition<CompareNode>[] {
    return [
      {
        type: 'dropdown',
        label: 'Comparison Function',
        dataKey: 'comparisonFunction',
        options: [
          { label: '==', value: '==' },
          { label: '!=', value: '!=' },
          { label: '<', value: '<' },
          { label: '<=', value: '<=' },
          { label: '>', value: '>' },
          { label: '>=', value: '>=' },
        ],
        useInputToggleDataKey: 'useComparisonFunctionInput',
      },
    ];
  }

  getBody(): string | undefined {
    return this.data.useComparisonFunctionInput ? 'A (Comparison Function) B' : `A ${this.data.comparisonFunction} B`;
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Compares two values using the configured operator and outputs the result.

        If the data types of the values do not match, then the B value is converted to the type of the A value.
      `,
      infoBoxTitle: 'Compare Node',
      contextMenuTitle: 'Compare',
      group: ['Logic'],
    };
  }

  async process(inputs: Inputs): Promise<Outputs> {
    const comparisonFunction = (
      this.data.useComparisonFunctionInput
        ? coerceType(inputs['comparisonFunction' as PortId], 'string')
        : this.data.comparisonFunction
    ) as CompareNodeData['comparisonFunction'];

    const inputA = inputs['a' as PortId];
    const inputB = inputs['b' as PortId];

    if (!inputA) {
      return {
        ['output' as PortId]: {
          type: 'boolean',
          value: match(comparisonFunction)
            .with('==', () => !inputB)
            .with('!=', () => !!inputB)
            .otherwise(() => false),
        },
      };
    }

    const value1 = inputA.value;
    const value2 = inputB?.type !== inputA.type ? coerceTypeOptional(inputB, inputA.type) : inputB.value;

    return {
      ['output' as PortId]: {
        type: 'boolean',
        value: match(comparisonFunction)
          .with('==', () => isEqual(value1, value2))
          .with('!=', () => !isEqual(value1, value2))
          .with('<', () => (value1 as any) < (value2 as any))
          .with('>', () => (value1 as any) > (value2 as any))
          .with('<=', () => (value1 as any) <= (value2 as any))
          .with('>=', () => (value1 as any) >= (value2 as any))
          .exhaustive(),
      },
    };
  }
}

export const compareNode = nodeDefinition(CompareNodeImpl, 'Compare');
