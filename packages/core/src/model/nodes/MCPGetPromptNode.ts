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

import { type EditorDefinition, type InternalProcessContext } from '../../index.js';

import { MCPError, MCPErrorType, type MCP } from '../../integrations/mcp/MCPProvider.js';

import { coerceTypeOptional } from '../../utils/coerceType.js';

import { dedent, getInputOrData } from '../../utils/index.js';
import { getError } from '../../utils/errors.js';
import { getMCPBaseInputs, type MCPBaseNodeData } from '../../integrations/mcp/MCPBase.js';
import { getServerHelperMessage, getServerOptions, loadMCPConfiguration } from '../../integrations/mcp/MCPUtils.js';
import type { RivetUIContext } from '../RivetUIContext.js';
import { keys } from '../../utils/typeSafety.js';
import { interpolate } from '../../utils/interpolation.js';

export type MCPGetPromptNode = ChartNode<'mcpGetPrompt', MCPGetPromptNodeData>;

export type MCPGetPromptNodeData = MCPBaseNodeData & {
  promptName: string;
  promptArguments?: string;

  usePromptNameInput?: boolean;
  usePromptArgumentsInput?: boolean;
};

export class MCPGetPromptNodeImpl extends NodeImpl<MCPGetPromptNode> {
  static create(): MCPGetPromptNode {
    const chartNode: MCPGetPromptNode = {
      type: 'mcpGetPrompt',
      title: 'MCP Get Prompt',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 250,
      },
      data: {
        name: 'mcp-get-prompt-client',
        version: '1.0.0',
        transportType: 'stdio',
        serverUrl: 'http://localhost:8080/mcp',
        serverId: '',
        promptName: '',
        promptArguments: dedent`
        {
          "key": "value"
        }`,
        useNameInput: false,
        useVersionInput: false,
        usePromptNameInput: false,
        usePromptArgumentsInput: false,
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    const inputs: NodeInputDefinition[] = getMCPBaseInputs(this.data);

    if (this.data.usePromptNameInput) {
      inputs.push({
        dataType: 'string',
        id: 'promptName' as PortId,
        title: 'Prompt Name',
      });
    }

    if (this.data.usePromptArgumentsInput) {
      inputs.push({
        dataType: 'object',
        id: 'promptArguments' as PortId,
        title: 'Prompt Arguments',
      });
    }

    return inputs;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    const outputDefinitions: NodeOutputDefinition[] = [];

    outputDefinitions.push({
      id: 'prompt' as PortId,
      title: 'Prompt',
      dataType: 'object',
      description: 'Prompt response result',
    });

    return outputDefinitions;
  }

  async getEditors(context: RivetUIContext): Promise<EditorDefinition<MCPGetPromptNode>[]> {
    const editors: EditorDefinition<MCPGetPromptNode>[] = [
      {
        type: 'string',
        label: 'Name',
        dataKey: 'name',
        useInputToggleDataKey: 'useNameInput',
        helperMessage: 'The name for the MCP Client',
      },
      {
        type: 'string',
        label: 'Version',
        dataKey: 'version',
        useInputToggleDataKey: 'useVersionInput',
        helperMessage: 'A version for the MCP Client',
      },
      {
        type: 'dropdown',
        label: 'Transport Type',
        dataKey: 'transportType',
        options: [
          { label: 'HTTP', value: 'http' },
          { label: 'STDIO', value: 'stdio' },
        ],
      },
      {
        type: 'string',
        label: 'Prompt Name',
        dataKey: 'promptName',
        useInputToggleDataKey: 'usePromptNameInput',
        helperMessage: 'The name for the MCP prompt',
      },
      {
        type: 'code',
        label: 'Prompt Arguments',
        dataKey: 'promptArguments',
        useInputToggleDataKey: 'usePromptArgumentsInput',
        language: 'json',
        helperMessage: 'Arguments to provide the prompt',
      },
    ];

    if (this.data.transportType === 'http') {
      editors.push({
        type: 'string',
        label: 'Server URL',
        dataKey: 'serverUrl',
        useInputToggleDataKey: 'useServerUrlInput',
        helperMessage: 'The endpoint URL for the MCP server to connect',
      });
    } else if (this.data.transportType === 'stdio') {
      const serverOptions = await getServerOptions(context);

      editors.push({
        type: 'dropdown',
        label: 'Server ID',
        dataKey: 'serverId',
        helperMessage: getServerHelperMessage(context, serverOptions.length),
        options: serverOptions,
      });
    }

    return editors;
  }

  getBody(context: RivetUIContext): string {
    let base;
    if (this.data.transportType === 'http') {
      base = this.data.useServerUrlInput ? '(Using Server URL Input)' : this.data.serverUrl;
    } else {
      base = `Server ID: ${this.data.serverId || '(None)'}`;
    }
    const namePart = `Name: ${this.data.name}`;
    const versionPart = `Version: ${this.data.version}`;
    const parts = [namePart, versionPart, base];

    if (context.executor !== 'nodejs') {
      parts.push('(Requires Node Executor)');
    }

    return parts.join('\n');
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Connects to an MCP (Model Context Protocol) server and gets a prompt response.
      `,
      infoBoxTitle: 'MCP Get Prompt Node',
      contextMenuTitle: 'MCP Get Prompt',
      group: ['MCP'],
    };
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const name = getInputOrData(this.data, inputs, 'name', 'string');
    const version = getInputOrData(this.data, inputs, 'version', 'string');

    const promptName = getInputOrData(this.data, inputs, 'promptName', 'string');

    let promptArguments;

    if (this.data.usePromptArgumentsInput) {
      promptArguments = getInputOrData(this.data, inputs, 'promptArguments', 'object');

      if (promptArguments == null) {
        throw new MCPError(MCPErrorType.INVALID_SCHEMA, 'Cannot parse tool argument with input toggle on');
      }
    } else {
      const inputMap = keys(inputs)
        .filter((key) => key.startsWith('input'))
        .reduce(
          (acc, key) => {
            const stringValue = coerceTypeOptional(inputs[key], 'string') ?? '';

            const interpolationKey = key.slice('input-'.length);
            acc[interpolationKey] = stringValue;
            return acc;
          },
          {} as Record<string, string>,
        );

      const interpolated = interpolate(this.data.promptArguments ?? '', inputMap);

      promptArguments = JSON.parse(interpolated);
    }

    const getPromptRequest: MCP.GetPromptRequest = {
      name: promptName,
      arguments: promptArguments,
    };

    const transportType = getInputOrData(this.data, inputs, 'transportType', 'string') as 'http' | 'stdio';

    let getPromptResponse: MCP.GetPromptResponse | undefined = undefined;

    try {
      if (!context.mcpProvider) {
        throw new Error('MCP Provider not found');
      }

      if (transportType === 'http') {
        const serverUrl = getInputOrData(this.data, inputs, 'serverUrl', 'string');
        if (!serverUrl || serverUrl === '') {
          throw new MCPError(MCPErrorType.SERVER_NOT_FOUND, 'No server URL was provided');
        }
        if (!serverUrl.includes('/mcp')) {
          throw new MCPError(
            MCPErrorType.SERVER_COMMUNICATION_FAILED,
            'Include /mcp in your server URL. For example: http://localhost:8080/mcp',
          );
        }

        getPromptResponse = await context.mcpProvider.getHTTPrompt({ name, version }, serverUrl, getPromptRequest);
      } else if (transportType === 'stdio') {
        const serverId = this.data.serverId ?? '';

        const mcpConfig = await loadMCPConfiguration(context);
        if (!mcpConfig.mcpServers[serverId]) {
          throw new MCPError(MCPErrorType.SERVER_NOT_FOUND, `Server ${serverId} not found in MCP config`);
        }

        const serverConfig = {
          config: mcpConfig.mcpServers[serverId],
          serverId,
        };

        getPromptResponse = await context.mcpProvider.getStdioPrompt({ name, version }, serverConfig, getPromptRequest);
      }

      const output: Outputs = {};

      output['response' as PortId] = {
        type: 'object',
        value: getPromptResponse as unknown as Record<string, unknown>,
      };

      return output;
    } catch (err) {
      const { message } = getError(err);
      if (context.executor === 'browser') {
        throw new Error('Failed to create Client without a node executor');
      }
      console.log(message);
      throw err;
    }
  }
}

export const mcpGetPromptNode = nodeDefinition(MCPGetPromptNodeImpl, 'MCP Get Prompt');
