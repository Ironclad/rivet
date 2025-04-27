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

export interface MCPConfig {
  mcpServers: Record<string, MCPServerConfig>;
}

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
  [key: string]: unknown;
  name: string;
  arguments?: { [x: string]: unknown };
  id?: string;
}

interface MCPBaseContent {
  type: MCPContentType;
}

type MCPContentType = 'text' | 'image' | 'audio';
interface MCPTextContent extends MCPBaseContent {
  type: 'text';
  text: string;
}

interface MCPImageContent extends MCPBaseContent {
  type: 'image';
  data: string;
  mimeType: string;
}

interface MCPAudioContent extends MCPBaseContent {
  type: 'audio';
  data: string;
  mimeType: string;
}

type MCPToolResponseContent = MCPTextContent | MCPImageContent | MCPAudioContent | { [key: string]: unknown };

export interface MCPToolResponse {
  content: MCPToolResponseContent[];
  isError?: boolean;
}

export interface MCPProvider {
  getHTTPTools(clientConfig: { name: string; version: string }, serverUrl: string): Promise<MCPTool[]>;

  getStdioTools(
    clientConfig: { name: string; version: string },
    serverConfig: MCPServerConfigWithId,
    cwd: string | undefined,
  ): Promise<MCPTool[]>;

  httpToolCall(
    clientConfig: { name: string; version: string },
    serverUrl: string,
    toolCall: MCPToolCall,
  ): Promise<MCPToolResponse>;
  stdioToolCall(
    clientConfig: { name: string; version: string },
    serverConfig: MCPServerConfigWithId,
    cwd: string | undefined,
    toolCall: MCPToolCall,
  ): Promise<MCPToolResponse>;
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
