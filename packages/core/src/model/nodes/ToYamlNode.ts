import { ChartNode, NodeId, NodeInputDefinition, PortId, NodeOutputDefinition } from '../NodeBase.js';
import { nanoid } from 'nanoid/non-secure';
import { NodeDefinition, NodeImpl, NodeUIData, nodeDefinition } from '../NodeImpl.js';
// @ts-ignore
import yaml from 'yaml';
import { Inputs, Outputs } from '../GraphProcessor.js';
import { coerceType } from '../../index.js';
import { dedent } from 'ts-dedent';

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

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Turns the input object into YAML text.
      `,
      infoBoxTitle: 'To YAML Node',
      contextMenuTitle: 'To YAML',
      group: ['Text'],
    };
  }

  async process(inputs: Inputs): Promise<Outputs> {
    const object = coerceType(inputs['object' as PortId], 'object');

    const toYaml = yaml.stringify(object, null, {
      indent: 2,
      aliasDuplicateObjects: false,
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
