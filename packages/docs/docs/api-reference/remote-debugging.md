# Remote Debugging with Rivet

## Introduction

One of the powerful features of Rivet is the ability to debug your graphs remotely. This means that you can execute a graph in your application and connect to it from Rivet to inspect the graph execution in real-time. This is achieved by using the `RivetDebuggerServer` which is included in the `@ironclad/rivet-node` package.

## Setting Up Remote Debugging

In order to set up remote debugging, you need to create an instance of `RivetDebuggerServer` and pass it to the `runGraph` or `runGraphInFile` functions. This will allow the graph execution to communicate with the debugger server.

You should only call `startDebuggerServer` once in your application. You can then pass the same instance to multiple `runGraph` or `runGraphInFile` calls.

Here's an example of how you can do this:

```typescript
import { startDebuggerServer, runGraphInFile } from '@ironclad/rivet-node';

// Start the debugger server
const debuggerServer = startDebuggerServer({
  port: 8080, // Optional: default 21888
});

// Run the graph with the debugger server
await runGraphInFile('./myProject.rivet', {
  graph: 'My Graph Name',
  remoteDebugger: debuggerServer, // Pass the debugger server
  // other options...
});
```

In this example, the `startDebuggerServer` function is used to start the debugger server. The `port` option is used to specify the port number on which the server will listen. The `runGraphInFile` function is then used to run the graph, and the debugger server is passed as the `remoteDebugger` option.

## Connecting to the Debugger Server from Rivet

Once the debugger server is running and a graph is being executed, you can connect to it from Rivet by clicking on the "Remote Debugging" button in the toolbar.

The syntax uses a WebSocket URL with the following format by default:

```
ws://<host>:<port>
```

To connect to a locally running server, you can use

```
ws://localhost:21888
```

However, you may use your own remote debugger WebSocket server and any URL you like in your application, but that is out of scope for this documentation.

## Advanced Options

The `startDebuggerServer` function provides several advanced options for handling multiple processors and clients, dynamic graph running, and graph uploading. For more details about these options, see the [startDebuggerServer API documentation](./node/startDebuggerServer).

## See Also

- [Getting Started with Rivet Integration](./getting-started-integration)
- [Rivet Node API Reference](./node/overview)
