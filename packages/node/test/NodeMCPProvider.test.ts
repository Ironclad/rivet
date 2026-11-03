import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NodeMCPProvider } from '../src/native/NodeMCPProvider.js';

const serverScript = join(dirname(fileURLToPath(import.meta.url)), 'fixtures/env-mcp-server.mjs');
const clientConfig = { name: 'rivet-test', version: '1.0.0' };

async function readServerEnv(name: string, env?: Record<string, string>): Promise<unknown> {
  const response = await new NodeMCPProvider().stdioToolCall(
    clientConfig,
    // `node` is resolved through PATH, so this also checks that the default environment is kept.
    { serverId: 'env-test', config: { command: 'node', args: [serverScript], env } },
    { name: 'read_env', arguments: { name } },
  );
  return response.content;
}

describe('NodeMCPProvider stdio', () => {
  it('passes env from the server config to the server process', async () => {
    const content = await readServerEnv('RIVET_MCP_TEST_TOKEN', { RIVET_MCP_TEST_TOKEN: 'secret-value' });
    assert.deepEqual(content, [{ type: 'text', text: 'secret-value' }]);
  });

  it('keeps the default environment when env is set', async () => {
    const content = await readServerEnv('PATH', { RIVET_MCP_TEST_TOKEN: 'secret-value' });
    assert.notDeepEqual(content, [{ type: 'text', text: '<unset>' }]);
  });

  it('works without env in the server config', async () => {
    const content = await readServerEnv('RIVET_MCP_TEST_TOKEN');
    assert.deepEqual(content, [{ type: 'text', text: '<unset>' }]);
  });
});
