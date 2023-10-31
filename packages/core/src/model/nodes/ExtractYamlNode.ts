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
import { type DataValue } from '../DataValue.js';
import yaml from 'yaml';
import { expectType } from '../../utils/expectType.js';
import { JSONPath } from 'jsonpath-plus';
import { dedent } from 'ts-dedent';
import { type EditorDefinition, type NodeBodySpec } from '../../index.js';
import { coerceType } from '../../utils/coerceType.js';

export type ExtractYamlNode = ChartNode<'extractYaml', ExtractYamlNodeData>;

export type ExtractYamlNodeData = {
  rootPropertyName: string;
  useRootPropertyNameInput?: boolean;
  objectPath?: string;
  useObjectPathInput?: boolean;
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
        useRootPropertyNameInput: false,
        useObjectPathInput: false,
        objectPath: undefined,
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    const inputs: NodeInputDefinition[] = [
      {
        id: 'input' as PortId,
        title: 'Input',
        dataType: 'string',
        required: true,
        coerced: false,
      },
    ];

    if (this.data.useRootPropertyNameInput) {
      inputs.push({
        id: 'rootPropertyName' as PortId,
        title: 'Root Property Name',
        dataType: 'string',
        required: true,
      });
    }

    if (this.data.useObjectPathInput) {
      inputs.push({
        id: 'objectPath' as PortId,
        title: 'Object Path',
        dataType: 'string',
        required: true,
      });
    }

    return inputs;
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

  getEditors(): EditorDefinition<ExtractYamlNode>[] {
    return [
      {
        type: 'string',
        label: 'Root Property Name',
        dataKey: 'rootPropertyName',
        useInputToggleDataKey: 'useRootPropertyNameInput',
      },
      {
        type: 'code',
        label: 'Object Path',
        dataKey: 'objectPath',
        language: 'jsonpath',
        useInputToggleDataKey: 'useObjectPathInput',
      },
    ];
  }

  getBody(): string | NodeBodySpec | undefined {
    return dedent`
      Root: ${this.data.useRootPropertyNameInput ? '(Using Input)' : this.data.rootPropertyName}
      ${
        this.data.useObjectPathInput
          ? 'Path: (Using Input)'
          : this.data.objectPath
          ? `Path: ${this.data.objectPath}`
          : ``
      }
    `;
  }
  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Finds and parses a YAML object in the input text with a predefined root property name (configurable).

        Defaults to \`yamlDocument\`, which means the input text must have a \`yamlDocument:\` root node somewhere in it. All indented text after that is considered part of the YAML.

        Outputs the parsed object.
      `,
      infoBoxTitle: 'Extract YAML Node',
      contextMenuTitle: 'Extract YAML',
      group: ['Objects'],
    };
  }

  async process(inputs: Record<PortId, DataValue>): Promise<Record<PortId, DataValue>> {
    const inputString = expectType(inputs['input' as PortId], 'string');

    const rootPropertyName = this.data.useRootPropertyNameInput
      ? coerceType(inputs['rootPropertyName' as PortId], 'string')
      : this.data.rootPropertyName;

    const objectPath = this.data.useObjectPathInput
      ? coerceType(inputs['objectPath' as PortId], 'string')
      : this.data.objectPath;

    const match = new RegExp(`^${rootPropertyName}:`, 'm').exec(inputString);
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

    if (!yamlObject?.hasOwnProperty(rootPropertyName)) {
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

    if (objectPath) {
      try {
        const extractedValue = JSONPath({ json: yamlObject, path: objectPath.trim() });
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

export const extractYamlNode = nodeDefinition(ExtractYamlNodeImpl, 'Extract YAML');
