import { type MCP, type MCPProvider } from '@ironclad/rivet-core';
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
    toolCall: MCP.ToolCallRequest,
  ): Promise<MCP.ToolCallResponse> {
    try {
      const client = await this.#getHTTPClient(clientConfig, serverUrl);

      const response = await this.#callTool(client, toolCall);
      await client.close();

      return response;
    } catch (err) {
      throw err;
    }
  }

  async getHTTPTools(clientConfig: { name: string; version: string }, serverUrl: string): Promise<MCP.Tool[]> {
    try {
      const client = await this.#getHTTPClient(clientConfig, serverUrl);

      const tools = await this.#getTools(client);
      await client.close();

      return tools;
    } catch (err) {
      throw err;
    }
  }

  async getHTTPrompts(clientConfig: { name: string; version: string }, serverUrl: string): Promise<MCP.Prompt[]> {
    try {
      const client = await this.#getHTTPClient(clientConfig, serverUrl);

      const prompts = await this.#getPrompts(client);
      await client.close();

      return prompts;
    } catch (err) {
      throw err;
    }
  }

  async getHTTPrompt(
    clientConfig: { name: string; version: string },
    serverUrl: string,
    getPromptRequest: MCP.GetPromptRequest,
  ): Promise<MCP.GetPromptResponse> {
    try {
      const client = await this.#getHTTPClient(clientConfig, serverUrl);

      const prompt = await this.#getPrompt(client, getPromptRequest);
      await client.close();

      return prompt;
    } catch (err) {
      throw err;
    }
  }

  /**
   * STDIO
   */

  async #getStdioClient(clientConfig: { name: string; version: string }, serverConfig: MCP.ServerConfigWithId) {
    try {
      const client = new Client(clientConfig);
      console.log(serverConfig);

      const transport = new StdioClientTransport({
        command: serverConfig.config.command,
        args: serverConfig.config.args || [],
      });

      await client.connect(transport);

      return client;
    } catch (err) {
      throw err;
    }
  }

  async stdioToolCall(
    clientConfig: { name: string; version: string },
    serverConfig: MCP.ServerConfigWithId,
    toolCall: MCP.ToolCallRequest,
  ): Promise<MCP.ToolCallResponse> {
    try {
      const client = await this.#getStdioClient(clientConfig, serverConfig);

      const response = await this.#callTool(client, toolCall);
      await client.close();

      return response;
    } catch (err) {
      throw err;
    }
  }

  async getStdioTools(
    clientConfig: { name: string; version: string },
    serverConfig: MCP.ServerConfigWithId,
  ): Promise<MCP.Tool[]> {
    try {
      const client = await this.#getStdioClient(clientConfig, serverConfig);

      const response = await this.#getTools(client);
      await client.close();

      return response;
    } catch (err) {
      throw err;
    }
  }

  async getStdioPrompts(
    clientConfig: { name: string; version: string },
    serverConfig: MCP.ServerConfigWithId,
  ): Promise<MCP.Prompt[]> {
    const client = await this.#getStdioClient(clientConfig, serverConfig);

    const response = await this.#getPrompts(client);
    await client.close();

    return response;
  }

  async getStdioPrompt(
    clientConfig: { name: string; version: string },
    serverConfig: MCP.ServerConfigWithId,
    getPromptRequest: MCP.GetPromptRequest,
  ): Promise<MCP.GetPromptResponse> {
    const client = await this.#getStdioClient(clientConfig, serverConfig);

    const response = await this.#getPrompt(client, getPromptRequest);

    await client.close();

    return response;
  }

  async #getPrompts(client: Client): Promise<MCP.Prompt[]> {
    try {
      const promptsResult = await client.listPrompts();

      const mcpPrompts: MCP.Prompt[] = promptsResult.prompts.map((prompt) => ({
        name: prompt.name,
        description: prompt.description,
        arugments: prompt.arguments,
      }));
      return mcpPrompts;
    } catch (err) {
      throw err;
    }
  }

  async #getPrompt(client: Client, getPrompt: MCP.GetPromptRequest): Promise<MCP.GetPromptResponse> {
    try {
      const promptResult = await client.getPrompt(getPrompt);
      const mcpPrompt: MCP.GetPromptResponse = {
        description: promptResult.description,
        messages: promptResult.messages,
      };

      return mcpPrompt;
    } catch (err) {
      throw err;
    }
  }

  async #getTools(client: Client): Promise<MCP.Tool[]> {
    try {
      const toolsResult = await client.listTools();

      const mcpTools: MCP.Tool[] = toolsResult.tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      }));
      return mcpTools;
    } catch (err) {
      throw err;
    }
  }

  async #callTool(client: Client, toolCall: MCP.ToolCallRequest): Promise<MCP.ToolCallResponse> {
    try {
      const toolResponse = await client.callTool(toolCall);
      const response = {
        content: toolResponse.content,
        isError: toolResponse.isError,
      } as MCP.ToolCallResponse;

      return response;
    } catch (err) {
      throw err;
    }
  }
}
