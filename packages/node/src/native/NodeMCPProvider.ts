import {
  type MCPPrompt,
  type MCPProvider,
  type MCPServerConfigWithId,
  type MCPTool,
  type MCPToolCall,
  type MCPToolResponse,
} from '@ironclad/rivet-core';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

export type MCPClient = Client;
export class NodeMCPProvider implements MCPProvider {
  /**
   * HTTP
   */
  async #getHTTPClient(clientConfig: { name: string; version: string }, serverUrl: string) {
    const url = new URL(serverUrl);

    try {
      const client = new Client(clientConfig);

      let transport: StreamableHTTPClientTransport | SSEClientTransport;

      try {
        transport = new StreamableHTTPClientTransport(url);
        await client.connect(transport);
      } catch (err) {
        const sseTransport = new SSEClientTransport(url);
        try {
          await client.connect(sseTransport);
        } catch (err) {
          throw err;
        }
      }

      return client;
    } catch (err) {
      throw err;
    }
  }

  async httpToolCall(
    clientConfig: { name: string; version: string },
    serverUrl: string,
    toolCall: MCPToolCall,
  ): Promise<MCPToolResponse> {
    try {
      const client = await this.#getHTTPClient(clientConfig, serverUrl);

      const response = await this.#callTool(client, toolCall);
      await client.close();

      return response;
    } catch (err) {
      throw err;
    }
  }

  async getHTTPTools(clientConfig: { name: string; version: string }, serverUrl: string): Promise<MCPTool[]> {
    try {
      const client = await this.#getHTTPClient(clientConfig, serverUrl);

      const tools = await this.#getTools(client);
      await client.close();

      return tools;
    } catch (err) {
      throw err;
    }
  }
  async getHTTPrompts(clientConfig: { name: string; version: string }, serverUrl: string): Promise<MCPPrompt[]> {
    try {
      const client = await this.#getHTTPClient(clientConfig, serverUrl);

      const prompts = await this.#getPrompts(client);
      await client.close();

      return prompts;
    } catch (err) {
      throw err;
    }
  }

  /**
   * STDIO
   */

  async #getStdioClient(
    clientConfig: { name: string; version: string },
    serverConfig: MCPServerConfigWithId,
    cwd: string | undefined,
  ) {
    try {
      const client = new Client(clientConfig);
      console.log(serverConfig);

      const transport = new StdioClientTransport({
        command: serverConfig.config.command,
        args: serverConfig.config.args || [],
        cwd: cwd,
      });

      await client.connect(transport);

      return client;
    } catch (err) {
      throw err;
    }
  }

  async stdioToolCall(
    clientConfig: { name: string; version: string },
    serverConfig: MCPServerConfigWithId,
    cwd: string | undefined,
    toolCall: MCPToolCall,
  ): Promise<MCPToolResponse> {
    try {
      const client = await this.#getStdioClient(clientConfig, serverConfig, cwd);

      const response = await this.#callTool(client, toolCall);
      await client.close();

      return response;
    } catch (err) {
      throw err;
    }
  }

  async getStdioTools(
    clientConfig: { name: string; version: string },
    serverConfig: MCPServerConfigWithId,
    cwd: string | undefined,
  ): Promise<MCPTool[]> {
    try {
      const client = await this.#getStdioClient(clientConfig, serverConfig, cwd);

      const response = await this.#getTools(client);
      await client.close();

      return response;
    } catch (err) {
      throw err;
    }
  }

  async getStdioPrompts(
    clientConfig: { name: string; version: string },
    serverConfig: MCPServerConfigWithId,
    cwd: string | undefined,
  ): Promise<MCPPrompt[]> {
    const client = await this.#getStdioClient(clientConfig, serverConfig, cwd);

    const response = await this.#getPrompts(client);
    await client.close();

    return response;
  }

  async #getPrompts(client: Client): Promise<MCPPrompt[]> {
    try {
      const toolsResult = await client.listPrompts();

      const mcpPrompts: MCPPrompt[] = toolsResult.prompts.map((prompt) => ({
        name: prompt.name,
        description: prompt.description,
        arugments: prompt.arguments,
      }));
      return mcpPrompts;
    } catch (err) {
      throw err;
    }
  }

  async #getTools(client: Client): Promise<MCPTool[]> {
    try {
      const toolsResult = await client.listTools();

      const mcpTools: MCPTool[] = toolsResult.tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      }));
      return mcpTools;
    } catch (err) {
      throw err;
    }
  }

  async #callTool(client: Client, toolCall: MCPToolCall): Promise<MCPToolResponse> {
    try {
      const toolResponse = await client.callTool(toolCall);
      const response = {
        content: toolResponse.content,
        isError: toolResponse.isError,
      } as MCPToolResponse;

      return response;
    } catch (err) {
      throw err;
    }
  }
}
