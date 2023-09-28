import type {
  ChartNode,
  NodeId,
  NodeInputDefinition,
  NodeOutputDefinition,
  NodeUIData,
  EditorDefinition,
  PortId,
  Inputs,
  InternalProcessContext,
  Outputs,
  NodeBodySpec,
} from '../../index.js';
import { NodeImpl } from '../NodeImpl.js';
import { coerceType, dedent, getInputOrData, newId } from '../../utils/index.js';
import { nodeDefinition } from '../NodeDefinition.js';

export type SplitNode = ChartNode<'split', SplitNodeData>;

type SplitNodeData = {
  delimiter: string;
  useDelimiterInput?: boolean;
};

export class SplitNodeImpl extends NodeImpl<SplitNode> {
  static create(): SplitNode {
    return {
      id: newId<NodeId>(),
      type: 'split',
      title: 'Split Text',
      visualData: { x: 0, y: 0, width: 250 },
      data: {
        delimiter: ',',
      },
    };
  }

  getInputDefinitions(): NodeInputDefinition[] {
    const inputs: NodeInputDefinition[] = [
      {
        id: 'string' as PortId,
        title: 'String',
        dataType: 'string',
      },
    ];

    if (this.data.useDelimiterInput) {
      inputs.push({
        id: 'delimiter' as PortId,
        title: 'Delimiter',
        dataType: 'string',
      });
    }

    return inputs;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'splitString' as PortId,
        title: 'Split',
        dataType: 'string[]',
      },
    ];
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Splits a string by the provided delimiter.
      `,
      infoBoxTitle: 'Split Text Node',
      contextMenuTitle: 'Split Text',
      group: ['Text'],
    };
  }

  getEditors(): EditorDefinition<SplitNode>[] | Promise<EditorDefinition<SplitNode>[]> {
    return [
      {
        type: 'code',
        label: 'Delimiter',
        language: 'plaintext',
        dataKey: 'delimiter',
        useInputToggleDataKey: 'useDelimiterInput',
      },
    ];
  }

  getBody(): string | NodeBodySpec | NodeBodySpec[] | undefined {
    if (this.data.useDelimiterInput) {
      return '(Delimiter from input)';
    }

    if (this.data.delimiter === '\n') {
      return '(New line)';
    }

    if (this.data.delimiter === '\t') {
      return '(Tab)';
    }

    if (this.data.delimiter === ' ') {
      return '(Space)';
    }

    return this.data.delimiter;
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const delimiter = getInputOrData(this.data, inputs, 'delimiter');
    const stringToSplit = coerceType(inputs['string' as PortId], 'string');

    const splitString = stringToSplit.split(delimiter);

    return {
      ['splitString' as PortId]: {
        type: 'string[]',
        value: splitString,
      },
    };
  }
}

export const splitNode = nodeDefinition(SplitNodeImpl, 'Split String');
