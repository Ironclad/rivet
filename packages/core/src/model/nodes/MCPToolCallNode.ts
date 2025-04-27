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

import {
  type EditorDefinition,
  type InternalProcessContext,
  MCPError,
  MCPErrorType,
  type MCPToolResponse,
} from '../../index.js';
import { coerceType, dedent, getInputOrData } from '../../utils/index.js';
import { getError } from '../../utils/errors.js';
import { getMCPBaseInputs, type MCPBaseNodeData } from '../../integrations/mcp/MCPBase.js';
import { getServerHelperMessage, getServerOptions, getStdioConfig } from '../../integrations/mcp/MCPUtils.js';
import type { RivetUIContext } from '../RivetUIContext.js';

export type MCPToolCallNode = ChartNode<'mcpToolCall', MCPToolCallNodeData>;

export type MCPToolCallNodeData = MCPBaseNodeData & {
  toolName: string;
  toolArguments: string;
  toolCallId?: string;

  useToolNameInput?: boolean;
  useToolArgumentsInput?: boolean;
  useToolCallIdInput?: boolean;
};

export class MCPToolCallNodeImpl extends NodeImpl<MCPToolCallNode> {
  static create(): MCPToolCallNode {
    const chartNode: MCPToolCallNode = {
      type: 'mcpToolCall',
      title: 'MCP Tool Call',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 250,
      },
      data: {
        name: 'mcp-client',
        version: '1.0.0',
        transportType: 'stdio',
        serverUrl: 'http://localhost:8080/mcp',
        serverId: '',
        headers: [],
        config: '',
        toolName: 'Name',
        toolArguments: dedent`
        {
          "key": "value",
        }`,
        toolCallId: 'Id',
        useNameInput: false,
        useVersionInput: false,
        useToolNameInput: true,
        useToolArgumentsInput: true,
        useToolCallIdInput: true,
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    const inputs: NodeInputDefinition[] = getMCPBaseInputs(this.data);

    if (this.data.toolName) {
      inputs.push({
        dataType: 'string',
        id: 'toolName' as PortId,
        title: 'Tool Name',
      });
    }

    if (this.data.toolArguments) {
      inputs.push({
        dataType: 'object',
        id: 'toolArguments' as PortId,
        title: 'Tool Arguments',
      });
    }

    if (this.data.toolCallId) {
      inputs.push({
        dataType: 'object',
        id: 'toolCallId' as PortId,
        title: 'Tool ID',
      });
    }

    return inputs;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    const outputDefinitions: NodeOutputDefinition[] = [];

    outputDefinitions.push({
      id: 'response' as PortId,
      title: 'Response',
      dataType: 'object',
      description: 'Response from the Tool Call',
    });

    outputDefinitions.push({
      id: 'toolCallId' as PortId,
      title: 'Tool ID',
      dataType: 'string',
      description: 'ID associated with the Tool Call',
    });

    return outputDefinitions;
  }

  async getEditors(context: RivetUIContext): Promise<EditorDefinition<MCPToolCallNode>[]> {
    const editors: EditorDefinition<MCPToolCallNode>[] = [
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
        label: 'Tool Name',
        dataKey: 'toolName',
        useInputToggleDataKey: 'useToolNameInput',
        helperMessage: 'The name for the MCP Tool Call',
      },
      {
        type: 'code',
        label: 'Tool Arguments',
        dataKey: 'toolArguments',
        language: 'json',
        useInputToggleDataKey: 'useToolArgumentsInput',
      },
      {
        type: 'string',
        label: 'Tool ID',
        dataKey: 'toolCallId',
        useInputToggleDataKey: 'useToolCallIdInput',
        helperMessage: 'The name for the MCP Tool Call',
      },
    ];

    if (this.data.transportType === 'http') {
      editors.push(
        {
          type: 'string',
          label: 'Server URL',
          dataKey: 'serverUrl',
          useInputToggleDataKey: 'useServerUrlInput',
          helperMessage: 'The endpoint URL for the MCP server to connect',
        },
        {
          type: 'keyValuePair',
          label: 'Headers',
          dataKey: 'headers',
          useInputToggleDataKey: 'useHeadersInput',
          keyPlaceholder: 'Header',
          valuePlaceholder: 'Value',
          helperMessage: 'Headers to send with requests',
        },
      );
    } else if (this.data.transportType === 'stdio') {
      editors.push({
        type: 'toggle',
        label: 'Use Configuration and Server ID Inputs',
        dataKey: 'useConfigInput',
        helperMessage: 'Whether to use inputs for configuration and server ID',
      });

      if (!this.data.useConfigInput) {
        const serverOptions = await getServerOptions(context);

        editors.push({
          type: 'dropdown',
          label: 'Server ID',
          dataKey: 'serverId',
          helperMessage: getServerHelperMessage(context, serverOptions.length),
          options: serverOptions,
        });
      }
    }

    return editors;
  }

  getBody(context: RivetUIContext): string {
    let base;
    if (this.data.transportType === 'http') {
      base = this.data.useServerUrlInput ? '(Using Server URL Input)' : this.data.serverUrl;
    } else {
      if (this.data.useConfigInput) {
        base = `Config: Input, Server ID: Input`;
      } else {
        base = `Server ID: ${this.data.serverId || '(None)'}`;
      }
    }
    const namePart = `Name: ${this.data.name}`;
    const versionPart = `Version: ${this.data.version}`;
    const parts = [namePart, versionPart, base];

    if (this.data.transportType === 'stdio' && context.executor !== 'nodejs') {
      parts.push('(Requires Node Executor)');
    }

    return parts.join('\n');
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Connects to an MCP (Model Context Protocol) server and calls a tool.
      `,
      infoBoxTitle: 'MCP Tool Call Node',
      contextMenuTitle: 'MCP Tool Call',
      group: ['AI', 'Integration'],
    };
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const name = getInputOrData(this.data, inputs, 'name', 'string');
    const version = getInputOrData(this.data, inputs, 'version', 'string');

    const toolName = getInputOrData(this.data, inputs, 'toolName', 'string');
    const toolArguments = getInputOrData(this.data, inputs, 'toolArguments', 'object');
    const toolCallId = getInputOrData(this.data, inputs, 'toolCallId', 'string');

    const toolCall = {
      name: toolName,
      arguments: toolArguments,
    };

    const transportType = getInputOrData(this.data, inputs, 'transportType', 'string') as 'http' | 'stdio';

    let toolResponse: MCPToolResponse | undefined = undefined;

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

        toolResponse = await context.mcpProvider.httpToolCall({ name, version }, serverUrl, toolCall);
      } else if (transportType === 'stdio') {
        const config = this.data.useConfigInput
          ? coerceType(inputs['config' as PortId], 'string')
          : this.data.config ?? '';
        const serverId = this.data.useConfigInput
          ? coerceType(inputs['config' as PortId], 'string')
          : this.data.serverId ?? '';

        const serverConfig = await getStdioConfig(context, config, serverId, this.data.useConfigInput);
        const cwd = context.nativeApi ? await context.nativeApi.resolveBaseDir('appConfig', '.') : undefined;

        toolResponse = await context.mcpProvider.stdioToolCall({ name, version }, serverConfig, cwd, toolCall);
      }

      const output: Outputs = {};

      output['response' as PortId] = {
        type: 'object[]',
        value: toolResponse?.content as unknown as Record<string, unknown>[],
      };

      output['toolCallId' as PortId] = {
        type: 'string',
        value: toolCallId,
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

export const mcpToolCallNode = nodeDefinition(MCPToolCallNodeImpl, 'Http Call');
