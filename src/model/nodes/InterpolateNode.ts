import { ChartNode, NodeId, NodeInputDefinition, NodeInputId, NodeOutputDefinition, NodeOutputId } from '../NodeBase';
import { nanoid } from 'nanoid';
import { NodeImpl } from '../NodeImpl';

export type InterpolateNode = ChartNode<'interpolate', InterpolateNodeData>;

export type InterpolateNodeData = {
  baseString: string;
  valueNames: string[];
};

export class InterpolateNodeImpl extends NodeImpl<InterpolateNode> {
  static create(baseString: string = 'Hello {{name}}!', valueNames: string[] = ['name']): InterpolateNodeImpl {
    const inputDefinitions: NodeInputDefinition[] = valueNames.map((valueName) => {
      return {
        type: 'string',
        id: valueName as NodeInputId,
        title: valueName,
        dataType: 'string',
        required: false,
      };
    });

    const outputDefinitions: NodeOutputDefinition[] = [
      {
        id: 'output' as NodeOutputId,
        title: 'Output',
        dataType: 'string',
      },
    ];

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
      inputDefinitions: inputDefinitions,
      outputDefinitions: outputDefinitions,
    };

    return new InterpolateNodeImpl(chartNode);
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
