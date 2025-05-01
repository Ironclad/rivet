import type { EditorDefinition } from '../../model/EditorDefinition.js';
import type { ChartNode, NodeInputDefinition, PortId } from '../../model/NodeBase.js';
import type { RivetUIContext } from '../../model/RivetUIContext.js';
import type { MCP } from './MCPProvider.js';
import { getServerHelperMessage, getServerOptions } from './MCPUtils.js';

export interface MCPBaseNodeData {
  name: string;
  version: string;
  transportType: MCP.TransportType;
  serverUrl?: string;
  serverId?: string;

  // Input toggles
  useNameInput?: boolean;
  useVersionInput?: boolean;
  useServerUrlInput?: boolean;
  useServerIdInput?: boolean;
}

export type MCPBaseNode = ChartNode<'mcpBase', MCPBaseNodeData>;

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
      title: 'Server URL',
      description: 'The endpoint URL for the MCP server',
    });
  }

  return inputs;
};

export const getMCPBaseEditors = async (
  context: RivetUIContext,
  data: MCPBaseNodeData,
): Promise<EditorDefinition<MCPBaseNode>[]> => {
  const editors = [];

  editors.push([
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
  ]);

  if (data.transportType === 'http') {
    editors.push({
      type: 'string',
      label: 'Server URL',
      dataKey: 'serverUrl',
      useInputToggleDataKey: 'useServerUrlInput',
      helperMessage: 'The endpoint URL for the MCP server to connect',
    });
  } else if (data.transportType === 'stdio') {
    const serverOptions = await getServerOptions(context);

    editors.push({
      type: 'dropdown',
      label: 'Server ID',
      dataKey: 'serverId',
      helperMessage: getServerHelperMessage(context, serverOptions.length),
      options: serverOptions,
    });
  }
  return editors as EditorDefinition<MCPBaseNode>[];
};
