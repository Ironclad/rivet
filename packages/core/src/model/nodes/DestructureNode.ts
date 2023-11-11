import {
  type ChartNode,
  type NodeId,
  type NodeInputDefinition,
  type PortId,
  type NodeOutputDefinition,
} from '../NodeBase.js';
import { nanoid } from 'nanoid/non-secure';
import { NodeImpl, type NodeUIData } from '../NodeImpl.js';
import { nodeDefinition } from '../NodeDefinition.js';
import { type DataValue } from '../DataValue.js';
import { JSONPath } from 'jsonpath-plus';
import { type EditorDefinition, type NodeBodySpec } from '../../index.js';
import { dedent } from 'ts-dedent';
import { coerceTypeOptional } from '../../utils/coerceType.js';

export type DestructureNode = ChartNode<'destructure', DestructureNodeData>;

export type DestructureNodeData = {
  paths: string[];
};

export class DestructureNodeImpl extends NodeImpl<DestructureNode> {
  static create(): DestructureNode {
    const chartNode: DestructureNode = {
      type: 'destructure',
      title: 'Destructure',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 250,
      },
      data: {
        paths: ['$.value'],
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    return [
      {
        id: 'object' as PortId,
        title: 'Object',
        dataType: 'object',
        required: true,
      },
    ];
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return this.chartNode.data.paths.map((path, index) => ({
      id: `match_${index}` as PortId,
      title: path,
      dataType: 'any',
    }));
  }

  getEditors(): EditorDefinition<DestructureNode>[] {
    return [
      {
        type: 'stringList',
        label: 'Paths',
        dataKey: 'paths',
        helperMessage:
          'One or more JSONPath expressions. Each expression will correspond to an output port of the node.',
      },
    ];
  }

  getBody(): string | NodeBodySpec | undefined {
    return '';
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Destructures the input value by extracting values at the specified paths. The paths use JSONPath notation to navigate through the value.
      `,
      infoBoxTitle: 'Destructure Node',
      contextMenuTitle: 'Destructure',
      group: ['Objects'],
    };
  }

  async process(inputs: Record<PortId, DataValue>): Promise<Record<PortId, DataValue>> {
    const inputObject = coerceTypeOptional(inputs['object' as PortId], 'object');

    const output: Record<PortId, DataValue> = {};

    this.chartNode.data.paths.forEach((path, index) => {
      let match: unknown;
      try {
        match = JSONPath<unknown>({ json: inputObject ?? null, path: path.trim(), wrap: true });
      } catch (err) {
        match = undefined;
      }

      output[`match_${index}` as PortId] = {
        type: 'any',
        value: match,
      };
    });

    return output;
  }
}

export const destructureNode = nodeDefinition(DestructureNodeImpl, 'Destructure');
