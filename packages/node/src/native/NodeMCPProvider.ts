import {
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
  async httpToolCall(
    clientConfig: { name: string; version: string },
    serverUrl: string,
    toolCall: MCPToolCall,
  ): Promise<MCPToolResponse> {
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
      const response = await this.#callTool(client, toolCall);
      await client.close();

      return response;
    } catch (err) {
      throw err;
    }
  }

  async getHTTPTools(clientConfig: { name: string; version: string }, serverUrl: string): Promise<MCPTool[]> {
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
      const tools = await this.#getTools(client);
      await client.close();

      return tools;
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
      const client = new Client(clientConfig);
      console.log(serverConfig);

      const transport = new StdioClientTransport({
        command: serverConfig.config.command,
        args: serverConfig.config.args || [],
        cwd: cwd,
      });

      await client.connect(transport);
      const tools = await this.#callTool(client, toolCall);

      await client.close();

      return tools;
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
      const client = new Client(clientConfig);
      console.log(serverConfig);

      const transport = new StdioClientTransport({
        command: serverConfig.config.command,
        args: serverConfig.config.args || [],
        cwd: cwd,
      });

      await client.connect(transport);
      const tools = await this.#getTools(client);

      await client.close();

      return tools;
    } catch (err) {
      throw err;
    }
  }

  async #getTools(client: Client): Promise<MCPTool[]> {
    const toolsResult = await client.listTools();

    const mcpTools: MCPTool[] = toolsResult.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));
    return mcpTools;
  }

  async #callTool(client: Client, toolCall: MCPToolCall): Promise<MCPToolResponse> {
    const toolResponse = await client.callTool(toolCall);
    const response = {
      content: toolResponse.content,
      isError: toolResponse.isError,
    } as MCPToolResponse;

    return response;
  }
}
