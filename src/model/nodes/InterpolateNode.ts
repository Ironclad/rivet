import { ChartNode, NodeId, NodeInputDefinition, PortId, NodeOutputDefinition } from '../NodeBase';
import { nanoid } from 'nanoid';
import { NodeImpl } from '../NodeImpl';
import { DataValue } from '../DataValue';
import { match } from 'ts-pattern';

export type InterpolateNode = ChartNode<'interpolate', InterpolateNodeData>;

export type InterpolateNodeData = {
  text: string;
};

export class InterpolateNodeImpl extends NodeImpl<InterpolateNode> {
  static create(text: string = 'Hello {{name}}!'): InterpolateNode {
    const chartNode: InterpolateNode = {
      type: 'interpolate',
      title: 'Interpolate',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
      },
      data: {
        text,
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    // Extract inputs from text, everything like {{input}}
    const inputNames = this.chartNode.data.text.match(/\{\{([^}]+)\}\}/g);
    return (
      inputNames?.map((inputName) => {
        return {
          type: 'string',
          // id and title should not have the {{ and }}
          id: inputName.slice(2, -2) as PortId,
          title: inputName.slice(2, -2),
          dataType: 'string',
          required: false,
        };
      }) ?? []
    );
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'output' as PortId,
        title: 'Output',
        dataType: 'string',
      },
    ];
  }

  interpolate(baseString: string, values: Record<string, any>): string {
    return baseString.replace(/\{\{([^}]+)\}\}/g, (_m, p1) => {
      const value = values[p1.trim()];
      return value !== undefined ? value.toString() : '';
    });
  }

  async process(inputs: Record<string, DataValue>): Promise<Record<string, DataValue>> {
    const inputMap = Object.keys(inputs).reduce((acc, key) => {
      const stringValue = match(inputs[key])
        .with({ type: 'boolean' }, (v) => v.value.toString())
        .with({ type: 'number' }, (v) => v.value.toString())
        .with({ type: 'string' }, (v) => v.value)
        .otherwise(() => '');

      acc[key] = stringValue;
      return acc;
    }, {} as Record<string, string>);

    const outputValue = this.interpolate(this.chartNode.data.text, inputMap);

    return {
      output: {
        type: 'string',
        value: outputValue,
      },
    };
  }
}
