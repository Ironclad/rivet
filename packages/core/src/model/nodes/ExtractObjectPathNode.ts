import { ChartNode, NodeId, NodeInputDefinition, PortId, NodeOutputDefinition } from '../NodeBase.js';
import { nanoid } from 'nanoid';
import { NodeImpl, NodeUIData, nodeDefinition } from '../NodeImpl.js';
import { DataValue } from '../DataValue.js';
import { JSONPath } from 'jsonpath-plus';
import { expectType } from '../../utils/expectType.js';
import { EditorDefinition, NodeBodySpec, coerceTypeOptional } from '../../index.js';
import { dedent } from 'ts-dedent';

export type ExtractObjectPathNode = ChartNode<'extractObjectPath', ExtractObjectPathNodeData>;

export type ExtractObjectPathNodeData = {
  path: string;
  usePathInput: boolean;
};

export class ExtractObjectPathNodeImpl extends NodeImpl<ExtractObjectPathNode> {
  static create(): ExtractObjectPathNode {
    const chartNode: ExtractObjectPathNode = {
      type: 'extractObjectPath',
      title: 'Extract Object Path',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 250,
      },
      data: {
        path: '$',
        usePathInput: false,
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    const inputDefinitions: NodeInputDefinition[] = [
      {
        id: 'object' as PortId,
        title: 'Object',
        dataType: 'object',
        required: true,
      },
    ];

    if (this.chartNode.data.usePathInput) {
      inputDefinitions.push({
        id: 'path' as PortId,
        title: 'Path',
        dataType: 'string',
        required: true,
      });
    }

    return inputDefinitions;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'match' as PortId,
        title: 'Match',
        dataType: 'any',
      },
      {
        id: 'all_matches' as PortId,
        title: 'All Matches',
        dataType: 'any[]',
      },
    ];
  }

  getEditors(): EditorDefinition<ExtractObjectPathNode>[] {
    return [
      {
        type: 'code',
        label: 'Path',
        dataKey: 'path',
        language: 'jsonpath',
        useInputToggleDataKey: 'usePathInput',
      },
    ];
  }

  getBody(): string | NodeBodySpec | undefined {
    return this.data.usePathInput ? '(Using Input)' : this.data.path;
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Extracts the value at the specified path from the input value. The path uses JSONPath notation to navigate through the value.
      `,
      infoBoxTitle: 'Extract Object Path Node',
      contextMenuTitle: 'Extract Object Path',
      group: ['Objects'],
    };
  }

  async process(inputs: Record<PortId, DataValue>): Promise<Record<PortId, DataValue>> {
    const inputObject = coerceTypeOptional(inputs['object' as PortId], 'object');
    const inputPath = this.chartNode.data.usePathInput
      ? expectType(inputs['path' as PortId], 'string')
      : this.chartNode.data.path;

    if (!inputPath) {
      throw new Error('Path input is not provided');
    }

    let matches: unknown[];
    try {
      matches = JSONPath({ json: inputObject ?? null, path: inputPath.trim() });
    } catch (err) {
      matches = [];
    }

    if (matches.length === 0) {
      return {
        ['match' as PortId]: {
          type: 'control-flow-excluded',
          value: undefined,
        },
        ['all_matches' as PortId]: {
          type: 'any[]',
          value: [],
        },
      };
    }

    return {
      ['match' as PortId]: {
        type: 'any',
        value: matches[0],
      },
      ['all_matches' as PortId]: {
        type: 'any[]',
        value: matches,
      },
    };
  }
}

export const extractObjectPathNode = nodeDefinition(ExtractObjectPathNodeImpl, 'Extract Object Path');
