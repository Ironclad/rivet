import {
  ChartNode,
  NodeId,
  NodeImpl,
  NodeInputDefinition,
  NodeOutputDefinition,
  NodeUIData,
  dedent,
  nodeDefinition,
  newId,
  EditorDefinition,
  PortId,
  getInputOrData,
  coerceType,
  Inputs,
  InternalProcessContext,
  Outputs,
} from '../../index.js';

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
        type: 'string',
        label: 'Delimiter',
        dataKey: 'delimiter',
        useInputToggleDataKey: 'useDelimiterInput',
      },
    ];
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
