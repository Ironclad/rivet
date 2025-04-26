export type MCPTransportType = 'stdio' | 'http';

export interface MCPServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  disabled?: boolean;
  alwaysAllow?: string[];
}

export type MCPServerConfigWithId = {
  config: MCPServerConfig;
  serverId: string;
};

export type MCPConfig = Record<string, MCPServerConfig>;

export interface MCPToolAnnotations {
  title?: string;
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
}

export interface MCPTool {
  name: string;
  description?: string;
  inputSchema: { [x: string]: unknown };
  annotations?: MCPToolAnnotations;
}

export interface MCPToolCall {
  name: string;
  arguments: { [x: string]: unknown };
}

export interface MCPProvider {
  getHTTPTools(clientConfig: { name: string; version: string }, serverUrl: string): Promise<MCPTool[]>;

  getStdioTools(
    clientConfig: { name: string; version: string },
    serverConfig: MCPServerConfigWithId,
    cwd: string | undefined,
  ): Promise<MCPTool[]>;
}

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
