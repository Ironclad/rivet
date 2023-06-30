import { ChartNode, NodeId, NodeInputDefinition, PortId, NodeOutputDefinition } from '../NodeBase';
import { nanoid } from 'nanoid';
import { EditorDefinition, NodeImpl, nodeDefinition } from '../NodeImpl';
import { Inputs, Outputs } from '../GraphProcessor';
import { DataValue, coerceType } from '../..';
import { zip } from 'lodash-es';

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
