import { ChartNode, NodeId, NodeInputDefinition, PortId, NodeOutputDefinition } from '../NodeBase';
import { nanoid } from 'nanoid';
import { NodeImpl } from '../NodeImpl';

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

  async process(inputs: Record<string, any>): Promise<Record<string, any>> {
    const inputMap = Object.keys(inputs).reduce((acc, key) => {
      acc[key] = inputs[key];
      return acc;
    }, {} as Record<string, any>);

    const outputValue = this.interpolate(this.chartNode.data.text, inputMap);

    return {
      output: outputValue,
    };
  }
}
