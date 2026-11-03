// Minimal stdio MCP server for tests. It exposes one tool, `read_env`, that
// returns the value of an environment variable as seen by the server process.
import { createInterface } from 'node:readline';

const send = (message) => process.stdout.write(`${JSON.stringify(message)}\n`);

createInterface({ input: process.stdin }).on('line', (line) => {
  const message = JSON.parse(line);
  if (message.id === undefined) {
    return;
  }

  if (message.method === 'initialize') {
    send({
      jsonrpc: '2.0',
      id: message.id,
      result: {
        protocolVersion: message.params.protocolVersion,
        capabilities: { tools: {} },
        serverInfo: { name: 'env-test-server', version: '1.0.0' },
      },
    });
  } else if (message.method === 'tools/call' && message.params.name === 'read_env') {
    const value = process.env[message.params.arguments.name];
    send({
      jsonrpc: '2.0',
      id: message.id,
      result: { content: [{ type: 'text', text: value ?? '<unset>' }] },
    });
  } else {
    send({ jsonrpc: '2.0', id: message.id, error: { code: -32601, message: 'Method not found' } });
  }
});
