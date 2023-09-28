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
import { type Inputs, type Outputs } from '../GraphProcessor.js';
import { type DataValue } from '../../index.js';
import { zip } from 'lodash-es';
import { dedent } from 'ts-dedent';
import { coerceType } from '../../utils/coerceType.js';

export type FilterNode = ChartNode<'filter', FilterNodeData>;

export type FilterNodeData = {};

export class FilterNodeImpl extends NodeImpl<FilterNode> {
  static create(): FilterNode {
    const chartNode: FilterNode = {
      type: 'filter',
      title: 'Filter',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 175,
      },
      data: {},
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    return [
      {
        id: 'array' as PortId,
        title: 'Array',
        dataType: 'any[]',
        required: true,
      },
      {
        id: 'include' as PortId,
        title: 'Include',
        dataType: 'boolean[]',
        required: true,
      },
    ];
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'filtered' as PortId,
        title: 'Filtered',
        dataType: 'any[]',
      },
    ];
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Takes in both an array of values, and an array of booleans of the same length, and filters the array where the corresponding boolean is true.
      `,
      infoBoxTitle: 'Filter Node',
      contextMenuTitle: 'Filter',
      group: ['Lists'],
    };
  }

  async process(inputs: Inputs): Promise<Outputs> {
    const array = coerceType(inputs['array' as PortId], 'any[]');
    const include = coerceType(inputs['include' as PortId], 'boolean[]');

    const zipped = zip(array, include);

    const filtered = zipped.filter(([_, include]) => include).map(([value, _]) => value);

    return {
      ['filtered' as PortId]: {
        type: inputs['array' as PortId]?.type ?? 'any',
        value: filtered,
      } as DataValue,
    };
  }
}

export const filterNode = nodeDefinition(FilterNodeImpl, 'Filter');
