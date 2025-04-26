import { type MCPProvider, type MCPServerConfigWithId, type MCPTool } from '@ironclad/rivet-core';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

export type MCPClient = Client;
export class NodeMCPProvider implements MCPProvider {
  async createClient(name: string, version: string): Promise<Client> {
    let client: Client;
    try {
      client = new Client({ name, version });
      return client;
    } catch (err) {
      throw err;
    }
  }

  async createHTTPConnection(baseUrl: string, client: any): Promise<any> {
    let transport: StreamableHTTPClientTransport | SSEClientTransport;
    const url = new URL(baseUrl);
    const mcpClient = client as Client;
    try {
      transport = new StreamableHTTPClientTransport(url);
      await mcpClient.connect(transport);
      console.log('Connected using Streamable HTTP transport');
      return mcpClient;
    } catch (err) {
      console.log('Streamable HTTP connection failed, falling back to SSE transport');
      const sseTransport = new SSEClientTransport(url);
      try {
        await mcpClient.connect(sseTransport);
        return mcpClient;
      } catch (err) {
        console.log('Failed to establish HTTP connection');
        throw err;
      }
    }
  }

  async createStdioConnection(serverConfig: MCPServerConfigWithId, cwd: string | undefined, client: any): Promise<any> {
    const mcpClient = client as Client;

    const transport = new StdioClientTransport({
      command: serverConfig.config.command,
      args: serverConfig.config.args || [],
      cwd: cwd,
    });

    try {
      await mcpClient.connect(transport);
      console.log('Connected using Stdio transport');
      return mcpClient;
    } catch (err) {
      console.log('Stdio connection failed');
      throw err;
    }
  }

  async getHTTPTools(clientConfig: { name: string; version: string }, serverUrl: string): Promise<MCPTool[]> {
    let client: Client;

    client = await this.createClient(clientConfig.name, clientConfig.version);
    client = await this.createHTTPConnection(serverUrl, client);
    return this.getTools(client);
  }

  async getStdioTools(
    clientConfig: { name: string; version: string },
    serverConfig: MCPServerConfigWithId,
    cwd: string | undefined,
  ): Promise<MCPTool[]> {
    let client: Client;

    client = await this.createClient(clientConfig.name, clientConfig.version);
    client = await this.createStdioConnection(serverConfig, cwd, client);
    return this.getTools(client);
  }

  async getTools(client: Client): Promise<MCPTool[]> {
    const toolsResult = await client.listTools();
    const mcpTools: MCPTool[] = toolsResult.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));
    return mcpTools;
  }
}
