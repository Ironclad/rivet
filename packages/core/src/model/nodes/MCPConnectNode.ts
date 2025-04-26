import { nanoid } from 'nanoid';
import type { ChartNode, NodeId, NodeInputDefinition, NodeOutputDefinition, PortId } from '../NodeBase.js';
import { NodeImpl } from '../NodeImpl.js';
import type { EditorDefinition } from '../EditorDefinition.js';
import {
  coerceType,
  MCPError,
  MCPErrorType,
  type Inputs,
  type InternalProcessContext,
  type MCPTool,
  type MCPTransportType,
  type NodeUIData,
  type Outputs,
} from '../../index.js';
import { dedent, getInputOrData } from '../../utils/index.js';
import { nodeDefinition } from '../NodeDefinition.js';
import type { RivetUIContext } from '../RivetUIContext.js';
import { getServerHelperMessage, getServerOptions, getStdioConfig } from '../../integrations/mcp/MCPUtils.js';

type MCPNode = ChartNode<'mcp', MCPNodeData>;

export interface MCPNodeData {
  name: string;
  version: string;
  transportType: MCPTransportType;
  serverUrl?: string;
  serverId?: string;
  // headers?: { key: string; value: string }[];
  config?: string;

  // Input toggles
  useNameInput?: boolean;
  useVersionInput?: boolean;
  useTransportTypeInput?: boolean;
  useServerUrlInput?: boolean;
  // useHeadersInput?: boolean;
  useConfigInput?: boolean;
  useServerIdInput?: boolean;

  // Output toggles
  useToolsOutput?: boolean;
  usePromptsOutput?: boolean;
}

class MCPNodeImpl extends NodeImpl<MCPNode> {
  static create(): MCPNode {
    const chartNode: MCPNode = {
      type: 'mcp',
      title: 'MCP Client',
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
        serverUrl: 'http://localhost:8080',
        serverId: '',
        // headers: [],
        config: '',
        useToolsOutput: true,
        usePromptsOutput: true,
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    const inputs: NodeInputDefinition[] = [];

    if (this.data.name) {
      inputs.push({
        dataType: 'string',
        id: 'name' as PortId,
        title: 'Name',
      });
    }

    if (this.data.version) {
      inputs.push({
        dataType: 'string',
        id: 'version' as PortId,
        title: 'Version',
      });
    }

    if (this.data.transportType === 'http' && this.data.useServerUrlInput) {
      inputs.push({
        dataType: 'string',
        id: 'serverUrl' as PortId,
        title: 'Server URL',
        description: 'The endpoint URL for the MCP server to connect',
      });
    } else if (this.data.transportType === 'stdio') {
      if (this.data.useConfigInput) {
        inputs.push({
          dataType: 'object',
          id: 'config' as PortId,
          title: 'Configuration',
          description: 'JSON local configuration for the MCP server',
          required: true,
        });
      }

      if (this.data.useServerIdInput) {
        inputs.push({
          dataType: 'string',
          id: 'serverId' as PortId,
          title: 'Server ID',
          description: 'The MCP server ID from the local configuration',
          required: true,
        });
      }
    }

    // if (this.data.useHeadersInput) {
    //   inputs.push({
    //     dataType: 'object',
    //     id: 'headers' as PortId,
    //     title: 'Headers',
    //     description: 'Headers to send with the MCP requests',
    //   });
    // }

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

    outputDefinitions.push({
      id: 'error' as PortId,
      title: 'Error',
      dataType: 'string',
      description: 'Error message if the request fails',
    });

    return outputDefinitions;
  }

  async getEditors(context: RivetUIContext): Promise<EditorDefinition<MCPNode>[]> {
    const editors: EditorDefinition<MCPNode>[] = [
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
        useInputToggleDataKey: 'useTransportTypeInput',
      },
      {
        type: 'code',
        label: 'Configuration',
        dataKey: 'config',
        language: 'json',
        useInputToggleDataKey: 'useConfigInput',
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
        // {
        //   type: 'keyValuePair',
        //   label: 'Headers',
        //   dataKey: 'headers',
        //   useInputToggleDataKey: 'useHeadersInput',
        //   keyPlaceholder: 'Header',
        //   valuePlaceholder: 'Value',
        //   helperMessage: 'Headers to send with requests',
        // },
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

    const parts = [base];

    if (this.data.transportType === 'stdio' && context.executor !== 'nodejs') {
      parts.push('(Requires Node Executor)');
    }

    // if (this.data.availableTools?.length) {
    //   parts.push(`(${this.data.availableTools.length} tools)`);
    // }

    return parts.join(' ');
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Connects to an MCP (Model Context Protocol) server to access external AI capabilities, tools, and resources.
        The node sends requests to the configured MCP server endpoint and returns the response.
      `,
      infoBoxTitle: 'MCP Node',
      contextMenuTitle: 'MCP',
      group: ['AI', 'Integration'],
    };
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const name = getInputOrData(this.data, inputs, 'name', 'string');
    const version = getInputOrData(this.data, inputs, 'version', 'string');

    const transportType = getInputOrData(this.data, inputs, 'transportType', 'string') as 'http' | 'stdio';

    let tools: MCPTool[] = [];

    let error;
    try {
      if (!context.mcpProvider) {
        throw new Error('MCP Provider not found');
      }

      if (transportType === 'http') {
        const serverUrl = getInputOrData(this.data, inputs, 'serverUrl', 'string');
        if (!serverUrl || serverUrl === '') {
          throw new MCPError(MCPErrorType.SERVER_NOT_FOUND, 'No server URL was provided');
        }

        tools = await context.mcpProvider.getHTTPTools({ name, version }, serverUrl);

        console.log('Connected using Streamable HTTP transport');
      } else if (transportType === 'stdio') {
        const config = coerceType(inputs['config' as PortId], 'string');
        const serverId = coerceType(inputs['config' as PortId], 'string');
        const serverConfig = await getStdioConfig(context, config, serverId, this.data.useConfigInput);
        const cwd = context.nativeApi ? await context.nativeApi.resolveBaseDir('appConfig', '.') : undefined;

        tools = await context.mcpProvider.getStdioTools({ name, version }, serverConfig, cwd);
      }
    } catch (err) {
      error = err;
    }

    const output: Outputs = {
      ['tools' as PortId]: {
        type: 'object',
        value: tools as unknown as Record<string, unknown>,
      },
      ['errors' as PortId]: {
        type: 'string',
        value: error as string,
      },
    };

    try {
      return output;
    } catch (err) {
      if (context.executor === 'browser') {
        throw new Error('Failed to create Client without a node executor');
      }

      throw err;
    }
  }
}

export const mcpNode = nodeDefinition(MCPNodeImpl, 'MCP Client');
