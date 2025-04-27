import { nanoid } from 'nanoid';
import type { ChartNode, NodeId, NodeInputDefinition, NodeOutputDefinition, PortId } from '../NodeBase.js';
import { NodeImpl } from '../NodeImpl.js';
import type { EditorDefinition } from '../EditorDefinition.js';
import {
  coerceType,
  getError,
  MCPError,
  MCPErrorType,
  type GptFunction,
  type Inputs,
  type InternalProcessContext,
  type MCPPrompt,
  type MCPTool,
  type NodeUIData,
  type Outputs,
} from '../../index.js';
import { dedent, getInputOrData } from '../../utils/index.js';
import { nodeDefinition } from '../NodeDefinition.js';
import type { RivetUIContext } from '../RivetUIContext.js';
import { getServerHelperMessage, getServerOptions, getStdioConfig } from '../../integrations/mcp/MCPUtils.js';
import { getMCPBaseInputs, type MCPBaseNodeData } from '../../integrations/mcp/MCPBase.js';

type MCPDiscoveryNode = ChartNode<'mcpDiscovery', MCPDiscoveryNodeData>;

export type MCPDiscoveryNodeData = MCPBaseNodeData & { useToolsOutput?: boolean; usePromptsOutput?: boolean };

class MCPDiscoveryNodeImpl extends NodeImpl<MCPDiscoveryNode> {
  static create(): MCPDiscoveryNode {
    const chartNode: MCPDiscoveryNode = {
      type: 'mcpDiscovery',
      title: 'MCP Discovery',
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
        useNameInput: false,
        useVersionInput: false,
        useToolsOutput: true,
        usePromptsOutput: true,
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    const inputs: NodeInputDefinition[] = getMCPBaseInputs(this.data);

    return inputs;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    const outputDefinitions: NodeOutputDefinition[] = [];

    if (this.data.useToolsOutput) {
      outputDefinitions.push({
        id: 'tools' as PortId,
        title: 'Tools',
        dataType: 'object[]',
        description: 'Tools returned from the MCP server',
      });
    }

    if (this.data.usePromptsOutput) {
      outputDefinitions.push({
        id: 'prompts' as PortId,
        title: 'Prompts',
        dataType: 'object[]',
        description: 'Prompts returned from the MCP server',
      });
    }
    return outputDefinitions;
  }

  async getEditors(context: RivetUIContext): Promise<EditorDefinition<MCPDiscoveryNode>[]> {
    const editors: EditorDefinition<MCPDiscoveryNode>[] = [
      {
        type: 'toggle',
        label: 'Output Tools',
        dataKey: 'useToolsOutput',
        helperMessage: 'Toggle on if you want to get a Tools output',
      },
      {
        type: 'toggle',
        label: 'Output Prompts',
        dataKey: 'usePromptsOutput',
        helperMessage: 'Toggle on if you want to get a Prompts output',
      },
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
        Connects to an MCP (Model Context Protocol) server to discover capabilities like tools and prompts.
      `,
      infoBoxTitle: 'MCP Discovery Node',
      contextMenuTitle: 'MCP Discovery',
      group: ['AI', 'Integration'],
    };
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const name = getInputOrData(this.data, inputs, 'name', 'string');
    const version = getInputOrData(this.data, inputs, 'version', 'string');

    const transportType = getInputOrData(this.data, inputs, 'transportType', 'string') as 'http' | 'stdio';

    let tools: MCPTool[] = [];
    let prompts: MCPPrompt[] = [];

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

        tools = await context.mcpProvider.getHTTPTools({ name, version }, serverUrl);
        prompts = await context.mcpProvider.getHTTPrompts({ name, version }, serverUrl);
      } else if (transportType === 'stdio') {
        const config = this.data.useConfigInput
          ? coerceType(inputs['config' as PortId], 'string')
          : this.data.config ?? '';
        const serverId = this.data.useConfigInput
          ? coerceType(inputs['config' as PortId], 'string')
          : this.data.serverId ?? '';

        const serverConfig = await getStdioConfig(context, config, serverId, this.data.useConfigInput);
        const cwd = context.nativeApi ? await context.nativeApi.resolveBaseDir('appConfig', '.') : undefined;

        tools = await context.mcpProvider.getStdioTools({ name, version }, serverConfig, cwd);
        prompts = await context.mcpProvider.getStdioPrompts({ name, version }, serverConfig, cwd);
      }

      const output: Outputs = {};

      const gptFunctions: GptFunction[] = tools.map((tool) => ({
        name: tool.name,
        description: tool.description ?? '',
        parameters: tool.inputSchema,
        strict: false,
      }));

      if (this.data.useToolsOutput) {
        output['tools' as PortId] = {
          type: 'gpt-function[]',
          value: gptFunctions,
        };
      }

      if (this.data.usePromptsOutput) {
        output['prompts' as PortId] = {
          type: 'object[]',
          value: prompts.map((prompt) => ({
            name: prompt.name,
            description: prompt.description,
            arguemnts: prompt.arugments,
          })),
        };
      }

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

export const mcpDiscoveryNode = nodeDefinition(MCPDiscoveryNodeImpl, 'MCP Discovery');
