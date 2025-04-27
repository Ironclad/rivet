import type { NodeInputDefinition, PortId } from '../../model/NodeBase.js';
import type { RivetUIContext } from '../../model/RivetUIContext.js';
import type { MCPTransportType } from './MCPProvider.js';
import { getServerHelperMessage, getServerOptions } from './MCPUtils.js';

export interface MCPBaseNodeData {
  name: string;
  version: string;
  transportType: MCPTransportType;
  serverUrl?: string;
  serverId?: string;
  headers?: { key: string; value: string }[];
  config?: string;

  // Input toggles
  useNameInput?: boolean;
  useVersionInput?: boolean;
  useServerUrlInput?: boolean;
  useHeadersInput?: boolean;
  useConfigInput?: boolean;
  useServerIdInput?: boolean;
}

export const getMCPBaseInputs = (data: MCPBaseNodeData) => {
  const inputs: NodeInputDefinition[] = [];

  if (data.useNameInput) {
    inputs.push({
      dataType: 'string',
      id: 'name' as PortId,
      title: 'Name',
    });
  }

  if (data.useVersionInput) {
    inputs.push({
      dataType: 'string',
      id: 'version' as PortId,
      title: 'Version',
    });
  }

  if (data.transportType === 'http' && data.useServerUrlInput) {
    inputs.push({
      dataType: 'string',
      id: 'serverUrl' as PortId,
      title: 'MCP Server URL',
      description: 'The endpoint URL for the MCP server to connect',
    });
  } else if (data.transportType === 'stdio') {
    if (data.useConfigInput) {
      inputs.push({
        dataType: 'object',
        id: 'config' as PortId,
        title: 'Configuration',
        description: 'JSON local configuration for the MCP server',
        required: true,
      });
    }
    if (data.useConfigInput) {
      inputs.push({
        dataType: 'object',
        id: 'serverId' as PortId,
        title: 'MCP Server ID',
        description: 'JSON local configuration for the MCP server',
        required: true,
      });
    }
  }

  if (data.useHeadersInput) {
    inputs.push({
      dataType: 'object',
      id: 'headers' as PortId,
      title: 'Headers',
      description: 'Headers to send with the MCP requests',
    });
  }

  return inputs;
};

export const getMCPBaseEditors = async (context: RivetUIContext, data: MCPBaseNodeData) => {
  const editors = [];

  editors.push([
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
  ]);

  if (data.transportType === 'http') {
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
  } else if (data.transportType === 'stdio') {
    editors.push({
      type: 'toggle',
      label: 'Use Configuration and Server ID Inputs',
      dataKey: 'useConfigInput',
      helperMessage: 'Whether to use inputs for configuration and server ID',
    });

    if (!data.useConfigInput) {
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
};

// export interface MCPDiscoveryNodeData {
//   name: string;
//   version: string;
//   transportType: MCPTransportType;
//   serverUrl?: string;
//   serverId?: string;
//   headers?: { key: string; value: string }[];
//   config?: string;

//   // Input toggles
//   useNameInput?: boolean;
//   useVersionInput?: boolean;
//   useServerUrlInput?: boolean;
//   useHeadersInput?: boolean;
//   useConfigInput?: boolean;
//   useServerIdInput?: boolean;

//   // Output toggles
//   useToolsOutput?: boolean;
//   usePromptsOutput?: boolean;
// }
