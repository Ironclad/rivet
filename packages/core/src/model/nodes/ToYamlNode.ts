import { ChartNode, NodeId, NodeInputDefinition, PortId, NodeOutputDefinition } from '../NodeBase.js';
import { nanoid } from 'nanoid';
import { NodeDefinition, NodeImpl, nodeDefinition } from '../NodeImpl.js';
// @ts-ignore
import yaml from 'yaml';
import { Inputs, Outputs } from '../GraphProcessor.js';
import { coerceType } from '../../index.js';

export type ToYamlNode = ChartNode<'toYaml', ToYamlNodeData>;

export type ToYamlNodeData = {};

export class ToYamlNodeImpl extends NodeImpl<ToYamlNode> {
  static create(): ToYamlNode {
    const chartNode: ToYamlNode = {
      type: 'toYaml',
      title: 'To YAML',
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
        id: 'object' as PortId,
        title: 'Object',
        dataType: 'object',
        required: true,
      },
    ];
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'yaml' as PortId,
        title: 'YAML',
        dataType: 'string',
      },
    ];
  }

  async process(inputs: Inputs): Promise<Outputs> {
    const object = coerceType(inputs['object' as PortId], 'object');

    const toYaml = yaml.stringify(object, null, {
      indent: 2,
    });

    return {
      ['yaml' as PortId]: {
        type: 'string',
        value: toYaml,
      },
    };
  }
}

export const toYamlNode = nodeDefinition(ToYamlNodeImpl, 'To YAML');
