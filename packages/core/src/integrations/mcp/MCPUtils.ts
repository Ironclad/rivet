import type { InternalProcessContext } from '../../model/ProcessContext.js';
import type { RivetUIContext } from '../../model/RivetUIContext.js';
import { MCPError, MCPErrorType, type MCP } from './MCPProvider.js';

export const loadMCPConfiguration = async (context: InternalProcessContext | RivetUIContext): Promise<MCP.Config> => {
  if (context.executor !== 'nodejs') {
    throw new MCPError(MCPErrorType.CONFIG_NOT_FOUND, 'MCP config is not supported in browser environment');
  }

  const mcpConfig = context.project.metadata.mcpServer;
  if (!mcpConfig || mcpConfig.mcpServers == null) {
    throw new MCPError(MCPErrorType.CONFIG_NOT_FOUND, 'MCP configuration not defined in Project tab');
  }

  return mcpConfig;
};

export const getServerOptions = async (context: RivetUIContext): Promise<{ label: string; value: string }[]> => {
  if (context.executor === 'nodejs' && context.nativeApi) {
    try {
      const config = await loadMCPConfiguration(context);

      return Object.entries(config.mcpServers)
        .filter(([, config]) => !config.disabled)
        .map(([id]) => ({
          label: id,
          value: id,
        }));
    } catch {}
  }
  return [];
};

export const getServerHelperMessage = (context: RivetUIContext, optionsLength: number): string => {
  if (optionsLength > 0) return 'Select an MCP server from local configuration located in the Project tab';
  if (context.executor !== 'nodejs') return 'MCP nodes require Node Executor';
  return 'No MCP servers found in config';
};
