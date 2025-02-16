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

## Streaming Mode

`rivet serve` exposes two different streaming modes depending on the application you will be integrating with. In both cases, the server will
stream events in the SSE (Server-Sent Events) format, which is a simple and efficient way to stream data from the server to the client.

### Rivet Events Streaming Mode

By default, when `--stream` is provided, the server will stream events in the Rivet Events format. This format is designed for application that
understand the Rivet Events system, and can handle the events appropriately.

Here is an example of streamed responses in Rivet Events format:

```
event: nodeStart
data: {
    "inputs": {
        "prompt": {
            "type": "string",
            "value": "h4110"
        }
    },
    "nodeId": "vzC9lcEyXZ2Q1-cCaG0v4",
    "nodeTitle": "Chat",
    "type": "nodeStart"
}

event: partialOutput
data: {
    "delta": "",
    "nodeId": "vzC9lcEyXZ2Q1-cCaG0v4",
    "nodeTitle": "Chat",
    "type": "partialOutput"
}

event: partialOutput
data: {
    "delta": "It seems like you entered \"h",
    "nodeId": "vzC9lcEyXZ2Q1-cCaG0v4",
    "nodeTitle": "Chat",
    "type": "partialOutput"
}

event: partialOutput
data: {
    "delta": "4110.\" Could",
    "nodeId": "vzC9lcEyXZ2Q1-cCaG0v4",
    "nodeTitle": "Chat",
    "type": "partialOutput"
}

event: partialOutput
data: {
    "delta": " you please provide more context or clarify what you would like to know or",
    "nodeId": "vzC9lcEyXZ2Q1-cCaG0v4",
    "nodeTitle": "Chat",
    "type": "partialOutput"
}

event: partialOutput
data: {
    "delta": " discuss regarding that term?",
    "nodeId": "vzC9lcEyXZ2Q1-cCaG0v4",
    "nodeTitle": "Chat",
    "type": "partialOutput"
}

event: nodeFinish
data: {
    "nodeId": "vzC9lcEyXZ2Q1-cCaG0v4",
    "nodeTitle": "Chat",
    "outputs": {
        "__hidden_token_count": {
            "type": "number",
            "value": 68
        },
        "all-messages": {
            "type": "chat-message[]",
            "value": [
                {
                    "message": "h4110",
                    "type": "user"
                },
                {
                    "message": "It seems like you entered \"h4110.\" Could you please provide more context or clarify what you would like to know or discuss regarding that term?",
                    "type": "assistant"
                }
            ]
        },
        "cost": {
            "type": "number",
            "value": 2.475e-05
        },
        "duration": {
            "type": "number",
            "value": 846
        },
        "in-messages": {
            "type": "chat-message[]",
            "value": [
                {
                    "message": "h4110",
                    "type": "user"
                }
            ]
        },
        "requestTokens": {
            "type": "number",
            "value": 10
        },
        "response": {
            "type": "string",
            "value": "It seems like you entered \"h4110.\" Could you please provide more context or clarify what you would like to know or discuss regarding that term?"
        },
        "responseTokens": {
            "type": "number",
            "value": 58
        },
        "usage": {
            "type": "object",
            "value": {
                "completion_cost": 2.325e-05,
                "completion_tokens": 31,
                "completion_tokens_details": {
                    "accepted_prediction_tokens": 0,
                    "audio_tokens": 0,
                    "reasoning_tokens": 0,
                    "rejected_prediction_tokens": 0
                },
                "prompt_cost": 1.4999999999999998e-06,
                "prompt_tokens": 10,
                "prompt_tokens_details": {
                    "audio_tokens": 0,
                    "cached_tokens": 0
                },
                "total_cost": 2.475e-05,
                "total_tokens": 41
            }
        }
    },
    "type": "nodeFinish"
}
```

You can see that the server is streaming events like `nodeStart`, `partialOutputs`, and `nodeFinish`. The data for each of the events is
a JSON object with the relevant information for that event.

#### Single-Node Streaming Mode

If you set `--stream=NodeId` or `--stream=NodeTitle`, the server will only stream events for the specified node. This is useful if you are only interested in the
events for a specific node in the graph.

### Text Streaming Mode

If you are integrating with a simple application that only likes having text responses, you can set `--stream-node=NodeId` / `--stream-node=NodeTitle` and `--stream` together.

This will cause the streaming to look like the following:

```
data: ""

data: "It seems like you entered \"h"

data: "4110,\" which could refer"

data: " to a variety of things depending on the context."

data: " It could be a model number, a"

data: " code, or something else."

data: " Could you please provide more details or clarify what you"

data: " are referring to?"

data: " This will help me assist you better!"
```

You can see that each `data` event contains a delta of the response text from the node.

You should only specify Chat nodes for this mode, as other nodes may not have partial outputs that support this.
