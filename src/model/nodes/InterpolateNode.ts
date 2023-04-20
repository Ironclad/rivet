import { ChartNode, NodeId, NodeInputDefinition, PortId, NodeOutputDefinition } from '../NodeBase';
import { nanoid } from 'nanoid';
import { NodeImpl } from '../NodeImpl';

export type InterpolateNode = ChartNode<'interpolate', InterpolateNodeData>;

export type InterpolateNodeData = {
  baseString: string;
  valueNames: string[];
};

export class InterpolateNodeImpl extends NodeImpl<InterpolateNode> {
  static create(baseString: string = 'Hello {{name}}!', valueNames: string[] = ['name']): InterpolateNode {
    const chartNode: InterpolateNode = {
      type: 'interpolate',
      title: 'Interpolate',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
      },
      data: {
        baseString: baseString,
        valueNames: valueNames,
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    return this.chartNode.data.valueNames.map((valueName) => {
      return {
        type: 'string',
        id: valueName as PortId,
        title: valueName,
        dataType: 'string',
        required: false,
      };
    });
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

  interpolate(baseString: string, valueNames: string[], values: Record<string, any>): string {
    return baseString.replace(/\{\{([^}]+)\}\}/g, (match, p1) => {
      const value = values[p1.trim()];
      return value !== undefined ? value.toString() : match;
    });
  }

  process(inputs: Record<string, any>): Record<string, any> {
    const baseString = this.chartNode.data.baseString;
    const valueNames = this.chartNode.data.valueNames;
    const values = valueNames.reduce((acc, valueName) => {
      acc[valueName] = inputs[valueName];
      return acc;
    }, {} as Record<string, any>);

    const outputValue = this.interpolate(baseString, valueNames, values);
    return {
      output: outputValue,
    };
  }
}
