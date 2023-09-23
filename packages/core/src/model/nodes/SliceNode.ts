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
import { entries } from '../../utils/typeSafety.js';
import { dedent } from 'ts-dedent';
import { type EditorDefinition } from '../EditorDefinition.js';
import { type NodeBodySpec } from '../../index.js';
import { coerceType } from '../../utils/coerceType.js';

export type SliceNode = ChartNode<'slice', SliceNodeData>;

export type SliceNodeData = {
  start?: number;
  useStartInput?: boolean;

  count?: number;
  useCountInput?: boolean;
};

export class SliceNodeImpl extends NodeImpl<SliceNode> {
  static create(): SliceNode {
    const chartNode: SliceNode = {
      type: 'slice',
      title: 'Slice',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 200,
      },
      data: {
        start: 0,
        count: undefined,
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    const inputs: NodeInputDefinition[] = [
      {
        dataType: 'any[]',
        id: 'input' as PortId,
        title: 'Input',
      },
    ];

    if (this.data.useStartInput) {
      inputs.push({
        dataType: 'number',
        id: 'start' as PortId,
        title: 'Start',
      });
    }

    if (this.data.useCountInput) {
      inputs.push({
        dataType: 'number',
        id: 'count' as PortId,
        title: 'Count',
      });
    }

    return inputs;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        dataType: 'any[]',
        id: 'output' as PortId,
        title: 'Output',
      },
    ];
  }

  getEditors(): EditorDefinition<SliceNode>[] {
    return [
      { type: 'number', label: 'Start', dataKey: 'start', allowEmpty: true },
      { type: 'number', label: 'Count', dataKey: 'count', allowEmpty: true },
    ];
  }

  getBody(): string | NodeBodySpec | NodeBodySpec[] | undefined {
    return dedent`
      Start: ${this.data.useStartInput ? '(Using Input)' : this.data.start == null ? '0' : this.data.start}
      Count: ${this.data.useCountInput ? '(Using Input)' : this.data.count == null ? 'All' : this.data.count}
    `;
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Slices an array from the start index for the count number of elements.

        Useful for extracting a portion of an array.
      `,
      infoBoxTitle: 'Slice Node',
      contextMenuTitle: 'Slice',
      group: ['Lists'],
    };
  }

  async process(inputs: Inputs): Promise<Outputs> {
    const inputArray = coerceType(inputs['input' as PortId], 'any[]');

    const start = this.data.start ?? 0;
    const count = this.data.count ?? inputArray.length;

    const outputArray = inputArray.slice(start, start + count);

    return {
      ['output' as PortId]: {
        type: 'any[]',
        value: outputArray,
      },
    };
  }
}

export const sliceNode = nodeDefinition(SliceNodeImpl, 'Slice');
