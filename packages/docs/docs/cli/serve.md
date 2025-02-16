---
id: serve
sidebar_label: serve
---

# Rivet CLI - `serve` Command

Serve a Rivet project using a local server.

## Quick Start

```bash
# Start server with default settings
npx @ironclad/rivet-cli serve

# Start server on custom port
npx @ironclad/rivet-cli serve --port 8080

# Start server in development mode
npx @ironclad/rivet-cli serve --dev
```

## Description

The `serve` command starts a local HTTP server that hosts your Rivet project, allowing you to execute graphs via HTTP requests. This is particularly useful for:

- Testing graphs in a production-like environment
- Integrating Rivet graphs into other applications
- Running graphs from scripts or automated tools
- Development and debugging of graph implementations

## Usage

The basic usage will serve the project file in the current directory, using the default port of 3000:

```bash
npx @ironclad/rivet-cli serve
```

You can also specify a different project file or port:

```bash
npx @ironclad/rivet-cli serve my-project.rivet-project --port 8080
```

Once the server is running, you can make POST requests to the server to run graphs.

## Inputs

Inputs to graphs are provided via the request body of the HTTP request. The request body should be a JSON object with the input values.

Input values should be provided as [Data Values](../user-guide/data-types.md), except for simple types like strings, numbers, and booleans.

For example, for a graph with two inputs, `input1` (string) and `input2` (object),
the request body should look like this:

```json
{
  "input1": "Hello, World!",
  "input2": {
    "type": "object",
    "value": {
      "key1": "value1",
      "key2": 42
    }
  }
}
```

## Outputs

The server will respond with a JSON object that contains the output values of the graph. Each Graph Output node in the graph will correspond to a key in the output JSON object.

The value of each property will be a [Data Value](../user-guide/data-types.md) object, with a `type` property and a `value` property.

For example, if a graph has two Graph Output Nodes, `output1` (a string) and `output2` (a number), the output JSON object will look like this:

```json
{
  "output1": {
    "type": "string",
    "value": "Hello, World!"
  },
  "output2": {
    "type": "number",
    "value": 42
  }
}
```

## Endpoints

### `POST /`

Run the main graph in the project file. The request body should contain the input values as described above.

Outputs a JSON object with the output values of the graph.

### `POST/:graphId`

This is only enabled if the `--allow-specifying-graph-id` flag is used. This endpoint runs a specific graph in the project file.

The request body should contain the input values as described above.

Outputs a JSON object with the output values of the graph.

## Options

### Server Configuration

- `--port <port>`: The port to run the server on. Default is 3000.
- `--dev`: Runs the server in development mode, which will reread the project file on each request. Useful for development.

### Graph Selection

- `--graph <graphNameOrId>`: The name or ID of the graph to run. If not provided, the main graph will be run. If there is no main graph, an error will be returned.
- `--allow-specifying-graph-id`: Allows specifying the graph ID in the URL path. This is disabled by default.

### OpenAI Configuration

- `--openai-api-key`: The OpenAI API key to use for the Chat node. Required if the project uses OpenAI functionality or otherwise requires an API key. If omitted, the environment variable `OPENAI_API_KEY` will be used.
- `--openai-endpoint`: The OpenAI API endpoint to use for the Chat node. Default is `https://api.openai.com/v1/chat/completions`. If omitted, the environment variable `OPENAI_ENDPOINT` will be used.
- `--openai-organization`: The OpenAI organization ID to use. If omitted, the environment variable `OPENAI_ORGANIZATION` will be used.

### Monitoring

- `--expose-cost`: Exposes the graph run cost as a property in the JSON response object. Disabled by default.

## Examples

### Running a Simple Graph

Request:

```bash
curl -X POST http://localhost:3000 -H "Content-Type: application/json" -d '{
  "name": "Alice",
  "age": 30
}'
```

Response:

```json
{
  "greeting": {
    "type": "string",
    "value": "Hello, Alice!"
  },
  "canVote": {
    "type": "boolean",
    "value": true
  }
}
```

## Security Considerations

- The server is intended for development and testing purposes
- No authentication is provided by the server, so it should not be exposed to the internet without additional security measures.
- Consider running behind a reverse proxy if exposed to the internet, to add security features like SSL, rate limiting, and authentication.
- Use environment variables for sensitive configuration like API keys
