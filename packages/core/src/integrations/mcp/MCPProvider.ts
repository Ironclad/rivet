/**
 * Derived from types here - https://github.com/modelcontextprotocol/typescript-sdk/blob/main/src/types.ts
 */

export namespace MCP {
  export type TransportType = 'stdio' | 'http';

  export interface ServerConfig {
    command: string;
    args?: string[];
    env?: Record<string, string>;
    disabled?: boolean;
    alwaysAllow?: string[];
  }

  export type ServerConfigWithId = {
    config: ServerConfig;
    serverId: string;
  };

  export interface Config {
    mcpServers: Record<string, ServerConfig>;
  }

  /**
   * Tools
   */
  interface ToolAnnotations {
    title?: string;
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
  }

  export interface Tool {
    name: string;
    description?: string;
    inputSchema: { [x: string]: unknown };
    annotations?: ToolAnnotations;
  }

  export interface ToolCallRequest {
    [key: string]: unknown;
    name: string;
    arguments?: { [x: string]: unknown };
    id?: string;
  }

  export interface ToolCallResponse {
    content: ResponseContent[];
    isError?: boolean;
  }

  /**
   * Prompts
   */
  interface PromptArgument {
    name: string;
    description?: string;
    required?: boolean;
  }
  export interface Prompt {
    name: string;
    description?: string;
    arugments?: PromptArgument[];
  }

  export interface GetPromptRequest {
    [x: string]: unknown;
    name: string;
    arguments?: { [x: string]: string };
  }

  export interface PromptMessage {
    role: 'user' | 'assistant';
    content: ResponseContent;
  }
  export interface GetPromptResponse {
    messages: PromptMessage[];
    description?: string;
  }

  /**
   * Content
   */
  interface BaseContent {
    type: 'text' | 'image' | 'audio';
  }
  interface TextContent extends BaseContent {
    type: 'text';
    text: string;
  }

  interface ImageContent extends BaseContent {
    type: 'image';
    data: string;
    mimeType: string;
  }

  interface AudioContent extends BaseContent {
    type: 'audio';
    data: string;
    mimeType: string;
  }

  type ResponseContent = TextContent | ImageContent | AudioContent | { [key: string]: unknown };
}

/**
 * Errors
 */
export enum MCPErrorType {
  CONFIG_NOT_FOUND = 'CONFIG_NOT_FOUND',
  SERVER_NOT_FOUND = 'SERVER_NOT_FOUND',
  SERVER_COMMUNICATION_FAILED = 'SERVER_COMMUNICATION_FAILED',
  INVALID_SCHEMA = 'INVALID_SCHEMA',
}

export class MCPError extends Error {
  constructor(
    public type: MCPErrorType,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'Error';
  }
}

/**
 * MCP Provider for Node Implementation
 */

export interface MCPProvider {
  getHTTPTools(clientConfig: { name: string; version: string }, serverUrl: string): Promise<MCP.Tool[]>;

  getStdioTools(
    clientConfig: { name: string; version: string },
    serverConfig: MCP.ServerConfigWithId,
  ): Promise<MCP.Tool[]>;

  getHTTPrompts(clientConfig: { name: string; version: string }, serverUrl: string): Promise<MCP.Prompt[]>;

  getStdioPrompts(
    clientConfig: { name: string; version: string },
    serverConfig: MCP.ServerConfigWithId,
  ): Promise<MCP.Prompt[]>;

  httpToolCall(
    clientConfig: { name: string; version: string },
    serverUrl: string,
    toolCall: MCP.ToolCallRequest,
  ): Promise<MCP.ToolCallResponse>;

  stdioToolCall(
    clientConfig: { name: string; version: string },
    serverConfig: MCP.ServerConfigWithId,
    toolCall: MCP.ToolCallRequest,
  ): Promise<MCP.ToolCallResponse>;

  getHTTPrompt(
    clientConfig: { name: string; version: string },
    serverUrl: string,
    getPromptRequest: MCP.GetPromptRequest,
  ): Promise<MCP.GetPromptResponse>;

  getStdioPrompt(
    clientConfig: { name: string; version: string },
    serverConfig: MCP.ServerConfigWithId,
    getPromptRequest: MCP.GetPromptRequest,
  ): Promise<MCP.GetPromptResponse>;
}
