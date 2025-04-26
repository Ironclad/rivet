import type { InternalProcessContext } from '../../model/ProcessContext.js';
import type { RivetUIContext } from '../../model/RivetUIContext.js';
import { MCPError, MCPErrorType, type MCPConfig, type MCPServerConfigWithId } from './MCPProvider.js';

export const loadMCPConfiguration = async (context: InternalProcessContext | RivetUIContext): Promise<MCPConfig> => {
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
};

export const getServerOptions = async (context: RivetUIContext): Promise<{ label: string; value: string }[]> => {
  if (context.executor === 'nodejs' && context.nativeApi) {
    try {
      const config = await loadMCPConfiguration(context);
      return Object.entries(config)
        .filter(([, config]) => !config.disabled)
        .map(([id]) => ({
          label: id,
          value: id,
        }));
    } catch {}
  }
  return [];
};

export const getStdioConfig = async (
  context: InternalProcessContext,
  config: string,
  serverId: string,
  useConfigInput?: boolean,
): Promise<MCPServerConfigWithId> => {
  let configFile: object = {};

  if (useConfigInput) {
    try {
      configFile = JSON.parse(config);
    } catch (error) {
      throw new MCPError(
        MCPErrorType.INVALID_RESPONSE,
        'Invalid format for MCP configuration. Expected valid JSON string.',
      );
    }
  }

  if (!serverId) {
    throw new MCPError(MCPErrorType.SERVER_NOT_FOUND, 'No server ID provided for stdio communication');
  }

  if (context.executor !== 'nodejs') {
    throw new MCPError(
      MCPErrorType.SERVER_COMMUNICATION_FAILED,
      'STDIO communication requires the Node executor. Please switch to the Node executor in the top-right menu.',
    );
  }

  let mcpConfig: MCPConfig;
  let serverConfig: MCPServerConfigWithId | { config: undefined; serverId: string };

  if (Object.keys(configFile).length === 0) {
    mcpConfig = await loadMCPConfiguration(context);
    serverConfig = {
      config: mcpConfig[serverId],
      serverId,
    };
  } else {
    serverConfig = {
      config: (configFile as MCPConfig)[serverId],
      serverId,
    };
  }

  if (!serverConfig.config) {
    throw new MCPError(MCPErrorType.SERVER_NOT_FOUND, `Server ${serverId} not found in MCP config`);
  }

  return serverConfig;
};

export const getServerHelperMessage = (context: RivetUIContext, optionsLength: number): string => {
  if (optionsLength > 0) return 'Select an MCP server from configuration';
  if (context.executor !== 'nodejs') return 'STDIO mode requires Node Executor';
  if (!context.nativeApi) return 'Native API not available';
  return 'No MCP servers found in config';
};
