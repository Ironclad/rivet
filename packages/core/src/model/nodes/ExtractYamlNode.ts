import { ChartNode, NodeId, NodeInputDefinition, PortId, NodeOutputDefinition } from '../NodeBase';
import { nanoid } from 'nanoid';
import { NodeImpl } from '../NodeImpl';
import { DataValue } from '../DataValue';
// @ts-ignore
import yaml from 'yaml';
import { expectType } from '../../utils/expectType';
import * as jp from 'jsonpath';

export type ExtractYamlNode = ChartNode<'extractYaml', ExtractYamlNodeData>;

export type ExtractYamlNodeData = {
  rootPropertyName: string;
  objectPath?: string;
};

export class ExtractYamlNodeImpl extends NodeImpl<ExtractYamlNode> {
  static create(): ExtractYamlNode {
    const chartNode: ExtractYamlNode = {
      type: 'extractYaml',
      title: 'Extract YAML',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 250,
      },
      data: {
        rootPropertyName: 'yamlDocument',
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    return [
      {
        id: 'input' as PortId,
        title: 'Input',
        dataType: 'string',
        required: true,
      },
    ];
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'output' as PortId,
        title: 'Output',
        dataType: 'object',
      },
      {
        id: 'matches' as PortId,
        title: 'Matches',
        dataType: 'any[]',
      },
      {
        id: 'noMatch' as PortId,
        title: 'No Match',
        dataType: 'string',
      },
    ];
  }

  async process(inputs: Record<PortId, DataValue>): Promise<Record<PortId, DataValue>> {
    const inputString = expectType(inputs['input' as PortId], 'string');

    const match = new RegExp(`^${this.data.rootPropertyName}:`, 'm').exec(inputString);
    const rootPropertyStart = match?.index ?? -1;

    const nextLines = inputString.slice(rootPropertyStart).split('\n');
    const yamlLines = [nextLines.shift()]; // remove the first line, which is the root property name

    while (nextLines[0]?.startsWith(' ') || nextLines[0]?.startsWith('\t') || nextLines[0] === '') {
      yamlLines.push(nextLines.shift());
    }

    const potentialYaml = yamlLines.join('\n');

    let yamlObject: Record<string, unknown> | undefined = undefined;
    try {
      yamlObject = yaml.parse(potentialYaml);
    } catch (err) {
      return {
        ['noMatch' as PortId]: {
          type: 'string',
          value: potentialYaml,
        },
        ['output' as PortId]: {
          type: 'control-flow-excluded',
          value: undefined,
        },
      };
    }

    if (!yamlObject?.hasOwnProperty(this.data.rootPropertyName)) {
      return {
        ['noMatch' as PortId]: {
          type: 'string',
          value: potentialYaml,
        },
        ['output' as PortId]: {
          type: 'control-flow-excluded',
          value: undefined,
        },
      };
    }

    let matches: unknown[] = [];

    if (this.data.objectPath) {
      try {
        const extractedValue = jp.query(yamlObject, this.data.objectPath);
        matches = extractedValue;
        yamlObject = extractedValue.length > 0 ? extractedValue[0] : undefined;
      } catch (err) {
        return {
          ['noMatch' as PortId]: {
            type: 'string',
            value: potentialYaml,
          },
          ['output' as PortId]: {
            type: 'control-flow-excluded',
            value: undefined,
          },
          ['matches' as PortId]: {
            type: 'control-flow-excluded',
            value: undefined,
          },
        };
      }
    }

    return {
      ['output' as PortId]:
        yamlObject === undefined
          ? {
              type: 'control-flow-excluded',
              value: undefined,
            }
          : this.data.objectPath
          ? {
              type: 'any',
              value: yamlObject,
            }
          : {
              type: 'object',
              value: yamlObject,
            },
      ['noMatch' as PortId]: {
        type: 'control-flow-excluded',
        value: undefined,
      },
      ['matches' as PortId]: {
        type: 'any[]',
        value: matches,
      },
    };
  }
}
