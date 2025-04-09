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
import { type EditorDefinition, type Inputs, type Outputs, type InternalProcessContext } from '../../index.js';
import { dedent } from 'ts-dedent';
import { coerceType } from '../../utils/coerceType.js';
import type { RivetUIContext } from '../RivetUIContext.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export type MCPNode = ChartNode<'mcp', MCPNodeData>;
export type MCPCommunicationMode = 'http' | 'stdio';

export interface MCPServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  disabled?: boolean;
  alwaysAllow?: string[];
}

export interface MCPToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

interface MCPServerInfo {
  tools: MCPToolDefinition[];
  metadata?: Record<string, unknown>;
}

export interface MCPNodeData {
  communicationMode: MCPCommunicationMode;
  endpoint: string;
  serverId?: string;
  useEndpointInput: boolean;
  headers: { key: string; value: string }[];
  useHeadersInput: boolean;
  configuration: { [key: string]: unknown };
  availableTools?: MCPToolDefinition[];
  config?: string;
  useConfigurationInput: boolean;
  useServerIdInput: boolean;
}

interface MCPConfig {
  mcpServers: Record<string, MCPServerConfig>;
}

export type MCPServerConfigWithId = {
  config: MCPServerConfig;
  serverId: string;
};

export enum MCPErrorType {
  CONFIG_NOT_FOUND = 'CONFIG_NOT_FOUND',
  SERVER_NOT_FOUND = 'SERVER_NOT_FOUND',
  SERVER_DISABLED = 'SERVER_DISABLED',
  SERVER_START_FAILED = 'SERVER_START_FAILED',
  SERVER_COMMUNICATION_FAILED = 'SERVER_COMMUNICATION_FAILED',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  HTTP_ERROR = 'HTTP_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class MCPError extends Error {
  constructor(
    public type: MCPErrorType,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'MCPError';
  }
}

async function loadMCPConfiguration(context: InternalProcessContext | RivetUIContext): Promise<MCPConfig> {
  if (context.executor !== 'nodejs') {
    throw new MCPError(MCPErrorType.CONFIG_NOT_FOUND, 'MCP config loading is not supported in browser environment');
  }

  const nativeApi = context.nativeApi;
  if (!nativeApi) {
    throw new MCPError(MCPErrorType.CONFIG_NOT_FOUND, 'Native API not available');
  }

  try {
    try {
      const configContent = await nativeApi.readTextFile('mcp-config.json');
      return JSON.parse(configContent);
    } catch {
      const configContent = await nativeApi.readTextFile('mcp-config.json', 'appConfig');
      return JSON.parse(configContent);
    }
  } catch (error) {
    throw new MCPError(
      MCPErrorType.CONFIG_NOT_FOUND,
      `Failed to load MCP config: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

async function handleStdioServerCommunication(
  serverId: string,
  configFile: MCPConfig | object,
  input: unknown,
  context: InternalProcessContext | RivetUIContext,
): Promise<{ output: string; metadata: Record<string, unknown> }> {
  let mcpConfig: MCPConfig;
  let serverConfig: MCPServerConfigWithId | { config: undefined; serverId: string };

  if (Object.keys(configFile).length === 0) {
    mcpConfig = await loadMCPConfiguration(context);
    serverConfig = {
      config: mcpConfig.mcpServers[serverId],
      serverId,
    };
  } else {
    serverConfig = {
      config: (configFile as MCPConfig).mcpServers?.[serverId],
      serverId,
    };
  }

  if (!serverConfig.config) {
    throw new MCPError(MCPErrorType.SERVER_NOT_FOUND, `Server ${serverId} not found in MCP config`);
  }
  let transport: StdioClientTransport | null = null;
  let client: Client | null = null;

  try {
    transport = new StdioClientTransport({
      command: serverConfig.config.command,
      args: serverConfig.config.args || [],
      cwd: context.nativeApi ? await context.nativeApi.resolveBaseDir('appConfig', '.') : undefined,
    });

    client = new Client(
      { name: 'mcp-client', version: '1.0.0' },
      { capabilities: { prompts: {}, resources: {}, tools: {} } },
    );
    await client.connect(transport);

    const toolInput = typeof input === 'string' ? JSON.parse(input) : input;
    const { toolName, args } = toolInput || {};

    let toolArgs = args;
    try {
      toolArgs = JSON.parse(args);
    } catch {}

    const response = await client.callTool({
      name: toolName,
      arguments: toolArgs,
    });

    let output: string = '';
    let metadata: Record<string, unknown> = {};

    if (typeof response === 'string') {
      output = response;
    } else if (typeof response === 'object' && response !== null) {
      output = JSON.stringify(response);
      metadata = (response as { metadata?: Record<string, unknown> }).metadata ?? {};
    }

    return { output, metadata };
  } catch (error) {
    throw new MCPError(
      MCPErrorType.SERVER_COMMUNICATION_FAILED,
      `Failed to communicate with MCP server: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  } finally {
    if (transport) {
      try {
        await transport.close();
      } catch {}
    }
  }
}

async function fetchServerTools(
  serverId: string,
  context: InternalProcessContext | RivetUIContext,
): Promise<MCPServerInfo> {
  const mcpConfig = await loadMCPConfiguration(context);
  const serverConfig: MCPServerConfigWithId | { config: undefined; serverId: string } = {
    config: mcpConfig.mcpServers?.[serverId],
    serverId,
  };

  if (!serverConfig.config) {
    throw new MCPError(MCPErrorType.SERVER_NOT_FOUND, `Server ${serverId} not found in MCP config`);
  }

  if (serverConfig.config.disabled) {
    throw new MCPError(MCPErrorType.SERVER_DISABLED, `Server ${serverId} is disabled`);
  }

  let transport: StdioClientTransport | null = null;
  let client: Client | null = null;

  try {
    transport = new StdioClientTransport({
      command: serverConfig.config.command,
      args: serverConfig.config.args || [],
      cwd: context.nativeApi ? await context.nativeApi.resolveBaseDir('appConfig', '.') : undefined,
    });

    client = new Client(
      { name: 'mcp-client', version: '1.0.0' },
      { capabilities: { prompts: {}, resources: {}, tools: {} } },
    );

    await client.connect(transport);

    const toolsResponse = await client.callTool({
      name: 'get_tools',
      arguments: {},
    });

    const tools = Array.isArray(toolsResponse)
      ? toolsResponse.map((tool: unknown) => ({
          name: String((tool as any).name || ''),
          description: String((tool as any).description || ''),
          parameters: ((tool as any).parameters as Record<string, unknown>) || {},
        }))
      : [];

    return {
      tools,
      metadata:
        typeof toolsResponse === 'object' && toolsResponse !== null
          ? (toolsResponse as { metadata?: Record<string, unknown> }).metadata || {}
          : {},
    };
  } catch (error) {
    throw new MCPError(
      MCPErrorType.SERVER_COMMUNICATION_FAILED,
      `Failed to fetch tools from server: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  } finally {
    if (transport) {
      try {
        await transport.close();
      } catch {}
    }
  }
}

export class MCPNodeImpl extends NodeImpl<MCPNode> {
  static create(): MCPNode {
    return {
      type: 'mcp',
      title: 'MCP',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 250,
      },
      data: {
        communicationMode: 'http',
        endpoint: 'http://localhost:8080',
        serverId: '',
        useEndpointInput: false,
        headers: [],
        useHeadersInput: false,
        configuration: {},
        useConfigurationInput: false,
        useServerIdInput: false,
      },
    };
  }

  getInputDefinitions(): NodeInputDefinition[] {
    const inputs: NodeInputDefinition[] = [];

    if (this.data.communicationMode === 'http' && this.data.useEndpointInput) {
      inputs.push({
        dataType: 'string',
        id: 'endpoint' as PortId,
        title: 'Endpoint',
        description: 'The endpoint URL for the MCP server',
      });
    } else if (this.data.communicationMode === 'stdio' && this.data.useConfigurationInput) {
      // Add both configuration and server ID inputs when useConfigurationInput is true
      inputs.push({
        dataType: 'string',
        id: 'config' as PortId,
        title: 'Configuration',
        description: 'JSON configuration for the MCP server',
        required: true,
      });

      inputs.push({
        dataType: 'string',
        id: 'serverId' as PortId,
        title: 'Server ID',
        description: 'The MCP server ID from configuration',
        required: true,
      });
    }

    if (this.data.useHeadersInput) {
      inputs.push({
        dataType: 'object',
        id: 'headers' as PortId,
        title: 'Headers',
        description: 'Headers to send with requests',
      });
    }

    inputs.push({
      dataType: 'object',
      id: 'input' as PortId,
      title: 'Input',
      description: 'The input object to send to the MCP server',
      required: true,
    });

    return inputs;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        dataType: 'string',
        id: 'output' as PortId,
        title: 'Output',
        description: 'The response from the MCP server as a string',
      },
      {
        dataType: 'object',
        id: 'metadata' as PortId,
        title: 'Metadata',
        description: 'Additional metadata from the MCP server response',
      },
      {
        dataType: 'string',
        id: 'error' as PortId,
        title: 'Error',
        description: 'Error message if the request fails',
      },
    ];
  }

  async getEditors(context: RivetUIContext): Promise<EditorDefinition<MCPNode>[]> {
    const editors: EditorDefinition<MCPNode>[] = [
      {
        type: 'dropdown',
        label: 'Communication Mode',
        dataKey: 'communicationMode',
        options: [
          { label: 'HTTP', value: 'http' },
          { label: 'STDIO', value: 'stdio' },
        ],
      },
    ];

    if (this.data.communicationMode === 'http') {
      editors.push(
        {
          type: 'string',
          label: 'Endpoint',
          dataKey: 'endpoint',
          useInputToggleDataKey: 'useEndpointInput',
          helperMessage: 'The endpoint URL for the MCP server',
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
    } else {
      editors.push({
        type: 'toggle',
        label: 'Use Configuration and Server ID Inputs',
        dataKey: 'useConfigurationInput',
        helperMessage: 'Whether to use inputs for configuration and server ID',
      });

      if (!this.data.useConfigurationInput) {
        const serverOptions = await this.getServerOptions(context);
        editors.push({
          type: 'dropdown',
          label: 'Server ID',
          dataKey: 'serverId',
          helperMessage: this.getServerHelperMessage(context, serverOptions.length),
          options: serverOptions,
        });
      }
    }

    return editors;
  }

  private async getServerOptions(context: RivetUIContext): Promise<{ label: string; value: string }[]> {
    if (context.executor === 'nodejs' && context.nativeApi) {
      try {
        const config = await loadMCPConfiguration(context);
        return Object.entries(config.mcpServers)
          .filter(([_, config]) => !config.disabled)
          .map(([id]) => ({
            label: id,
            value: id,
          }));
      } catch {}
    }
    return [];
  }

  private getServerHelperMessage(context: RivetUIContext, optionsLength: number): string {
    if (optionsLength > 0) return 'Select an MCP server from configuration';
    if (context.executor !== 'nodejs') return 'STDIO mode requires Node Executor';
    if (!context.nativeApi) return 'Native API not available';
    return 'No MCP servers found in config';
  }

  getBody(context: RivetUIContext): string | undefined {
    let base;
    if (this.data.communicationMode === 'http') {
      base = this.data.useEndpointInput ? '(Using Input)' : this.data.endpoint;
    } else {
      if (this.data.useConfigurationInput) {
        base = `Config: Input, Server ID: Input`;
      } else {
        base = `Server ID: ${this.data.serverId || '(None)'}`;
      }
    }

    const parts = [base];

    if (this.data.communicationMode === 'stdio' && context.executor !== 'nodejs') {
      parts.push('(Requires Node Executor)');
    }

    if (this.data.availableTools?.length) {
      parts.push(`(${this.data.availableTools.length} tools)`);
    }

    return parts.join(' ');
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    try {
      this.data.useServerIdInput = this.data.useConfigurationInput;

      const input = coerceType(inputs['input' as PortId], 'object');

      const response = await this.handleCommunication(inputs, input, context);
      return this.formatSuccessResponse(response);
    } catch (error) {
      return this.formatErrorResponse(error as MCPError);
    }
  }

  private async handleCommunication(
    inputs: Inputs,
    input: object,
    context: InternalProcessContext,
  ): Promise<{ output: string; metadata: Record<string, unknown> }> {
    if (this.data.communicationMode === 'http') {
      return this.handleHttpCommunication(inputs, input);
    }
    return this.handleStdioCommunication(inputs, input, context);
  }

  private async handleHttpCommunication(
    inputs: Inputs,
    input: object,
  ): Promise<{ output: string; metadata: Record<string, unknown> }> {
    const endpoint = this.data.useEndpointInput
      ? coerceType(inputs['endpoint' as PortId], 'string')
      : this.data.endpoint;

    const headers = this.data.useHeadersInput
      ? (inputs['headers' as PortId] as { type: 'object'; value: Record<string, string> })?.value ?? {}
      : Object.fromEntries(this.data.headers.map(({ key, value }) => [key, value]));

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({
        input,
        configuration: this.data.configuration,
      }),
    });

    if (!response.ok) {
      throw new MCPError(MCPErrorType.HTTP_ERROR, `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  private async handleStdioCommunication(
    inputs: Inputs,
    input: object,
    context: InternalProcessContext,
  ): Promise<{ output: string; metadata: Record<string, unknown> }> {
    let configFile: object = {};

    if (this.data.useConfigurationInput) {
      try {
        const configString = coerceType(inputs['config' as PortId], 'string');
        configFile = JSON.parse(configString);
      } catch (error) {
        throw new MCPError(
          MCPErrorType.INVALID_RESPONSE,
          'Invalid format for MCP configuration. Expected valid JSON string.',
        );
      }
    }

    const serverId = this.data.useConfigurationInput
      ? coerceType(inputs['serverId' as PortId], 'string')
      : this.data.serverId;

    if (!serverId) {
      throw new MCPError(MCPErrorType.SERVER_NOT_FOUND, 'No server ID provided for stdio communication');
    }

    if (context.executor !== 'nodejs') {
      throw new MCPError(
        MCPErrorType.SERVER_COMMUNICATION_FAILED,
        'STDIO communication requires the Node executor. Please switch to the Node executor in the top-right menu.',
      );
    }

    return handleStdioServerCommunication(serverId, configFile, input, context);
  }

  private formatSuccessResponse(response: { output: string; metadata: Record<string, unknown> }): Outputs {
    const metadata = {
      ...((response.metadata as Record<string, unknown>) || {}),
      availableTools: this.data.availableTools,
    };

    return {
      ['output' as PortId]: {
        type: 'string',
        value: response.output ?? '',
      },
      ['metadata' as PortId]: {
        type: 'object',
        value: metadata,
      },
      ['error' as PortId]: {
        type: 'string',
        value: '',
      },
    };
  }

  private formatErrorResponse(error: MCPError): Outputs {
    return {
      ['output' as PortId]: {
        type: 'string',
        value: '',
      },
      ['metadata' as PortId]: {
        type: 'object',
        value: {
          error: {
            type: error.type || MCPErrorType.UNKNOWN_ERROR,
            details: error.details,
          },
        },
      },
      ['error' as PortId]: {
        type: 'string',
        value: error.message || 'Unknown error occurred',
      },
    };
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

  onDataChanged(oldData: MCPNodeData, newData: MCPNodeData): void {
    if (oldData.useConfigurationInput !== newData.useConfigurationInput) {
      this.data.useServerIdInput = newData.useConfigurationInput;
    }
  }

  async updateAvailableTools(context: InternalProcessContext): Promise<void> {
    if (this.data.communicationMode === 'stdio' && this.data.serverId) {
      try {
        const serverInfo = await fetchServerTools(this.data.serverId, context);
        this.data.availableTools = serverInfo.tools;
      } catch {
        this.data.availableTools = undefined;
      }
    } else {
      this.data.availableTools = undefined;
    }
  }
}

export const mcpNode = nodeDefinition(MCPNodeImpl, 'MCP');
