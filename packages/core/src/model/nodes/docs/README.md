# MCP Node for Rivet

## Overview

The Model Context Protocol (MCP) Node enables communication with MCP-compliant servers through either HTTP or stdio interfaces. It allows you to send requests to external AI services or tools that implement the MCP protocol.

### Steps

1. Configure MCP servers (for stdio mode):

Create a configuration file in your OS-specific location:

- **MacOS**: `~/Library/Application Support/com.ironcladapp.rivet/mcp-config.json`
- **Windows**: `%APPDATA%/com.ironcladapp.rivet/mcp-config.json`
- **Linux**: `~/.local/share/com.ironcladapp.rivet/mcp-config.json`

For example, using MongoDB MCP server:

```bash
# MacOS
mkdir -p ~/Library/Application\ Support/com.ironcladapp.rivet
code ~/Library/Application\ Support/com.ironcladapp.rivet/mcp-config.json
```

Add your MCP server configuration:

```json
{
  "mcpServers": {
    "mongodb": {
      "command": "/Users/username/.nvm/versions/node/v22.11.0/bin/node",
      "args": [
        "--experimental-modules",
        "--es-module-specifier-resolution=node",
        "/path/to/mcp-mongo-server/build/index.js",
        "mongodb://localhost:27017/your-database?authSource=your-database"
      ]
    }
  }
}
```

## Using the MCP Node

The MCP Node provides two communication modes:

### 1. HTTP Mode

Uses standard HTTP POST requests to communicate with MCP servers. Works in both browser and Node environments.

#### Configuration:

1. Add MCP Node to your graph
2. Select "HTTP" mode
3. Configure endpoint URL
4. (Optional) Add custom headers

#### Input Format
```json
{
  "toolName": "your_tool",
  "args": {
    "param1": "value1",
    "param2": "value2"
  }
}
```

The node will wrap your input in this structure:
```json
{
  "input": "your-input-string",
  "configuration": {}
}
```

### 2. STDIO Mode

Launches and communicates with local MCP servers using standard input/output. **Requires Node Executor**.

> **Important**: STDIO mode requires the Node Executor to be enabled in Rivet. You can switch to the Node Executor using the dropdown in the top-right menu of the Rivet interface.

#### Configuration:

1. Enable Node Executor in Rivet (top-right menu)
2. Select "STDIO" mode in the MCP node
3. Choose your configured server from the dropdown
4. Send commands using this format:
   ```json
   {
     "toolName": "tool_name",
     "args": {
       // tool-specific arguments
     }
   }
   ```

### Tool Discovery

When using stdio mode (with Node Executor enabled), the MCP Node will:

1. Automatically discover available tools from the server
2. Display the number of available tools in the node
3. Include tool information in the metadata output

To list available tools:
```json
{
  "toolName": "get_tools",
  "args": {}
}
```

### Example Usage with MongoDB Server

1. First, clone and setup the MongoDB MCP server:
```bash
git clone https://github.com/kiliczsh/mcp-mongo-server
cd mcp-mongo-server
yarn install
yarn build
```

2. Configure in `mcp-config.json`:
```json
{
  "mcpServers": {
    "mongodb": {
      "command": "/Users/username/.nvm/versions/node/v22.11.0/bin/node",
      "args": [
        "--experimental-modules",
        "--es-module-specifier-resolution=node",
        "/path/to/mcp-mongo-server/build/index.js",
        "mongodb://localhost:27017/your-database"
      ]
    }
  }
}
```

3. In Rivet:
   - Enable Node Executor
   - Add MCP Node
   - Select "STDIO" mode
   - Choose "mongodb" from server dropdown

4. Example Commands:

#### Query All Documents
```json
{
  "toolName": "query",
  "args": {
    "filter": {},
    "collection": "users"
  }
}
```

5. Expected Responses:

For query operations:
```json
{
  "output": "[{\"_id\":\"...\",\"name\":\"John Doe\",\"age\":30,\"email\":\"john@example.com\"}]",
  "metadata": {
    "count": 1,
    "collection": "users",
    "operation": "query"
  }
}
```

### Error Handling

The node provides detailed error handling:

```typescript
enum MCPErrorType {
  CONFIG_NOT_FOUND = 'CONFIG_NOT_FOUND',
  SERVER_NOT_FOUND = 'SERVER_NOT_FOUND',
  SERVER_DISABLED = 'SERVER_DISABLED',
  SERVER_START_FAILED = 'SERVER_START_FAILED',
  SERVER_COMMUNICATION_FAILED = 'SERVER_COMMUNICATION_FAILED',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  HTTP_ERROR = 'HTTP_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}
```

### Troubleshooting

1. **STDIO Server Not Found**
   - Check `mcp-config.json` location
   - Verify file permissions
   - Ensure absolute paths in configuration

2. **HTTP Connection Failed**
   - Verify server URL
   - Check CORS settings
   - Confirm network connectivity

3. **Node Executor Issues**
   - Enable Node executor in Rivet settings
   - Verify Node.js installation
   - Check server executable permissions

## Available MCP Servers

The MCP community provides several ready-to-use servers:

| Server | Description | Repository |
|--------|-------------|------------|
| MongoDB | Database operations | [mcp-mongo-server](https://github.com/kiliczsh/mcp-mongo-server) |
| Claude | Anthropic's Claude AI | [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) |

## Best Practices

1. **Security**
   - Use HTTPS for production
   - Secure API keys in environment variables
   - Validate server responses
   - Use secure database connections

2. **Performance**
   - Monitor server resources
   - Implement proper error handling
   - Cache frequently used tools
   - Use appropriate timeouts

3. **Development**
   - Test with small datasets first
   - Document custom tools
   - Maintain version compatibility
   - Follow MCP specifications
