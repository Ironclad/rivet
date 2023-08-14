import { it, describe, mock } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';
import { GraphId, GraphProcessor, deserializeProject } from '../../src/index.js';

describe('GraphProcessor', () => {
  describe('RaceInputsNode', () => {
    it('should abort long-running nodes', async () => {
      try {
        const content = await readFile('test/model/GraphProcessor.test.RaceInputNode.rivet-project', { encoding: 'utf8' });
        const [project] = deserializeProject(content);
        const processor = new GraphProcessor(project, '9ilbaCrzWHBbEzmHZLMno' as GraphId);
        processor.setExternalFunction('wait', async () => new Promise(resolve => setTimeout(resolve, 3000)));
        const startTime = Date.now();
        await processor.processGraph({
          settings: {
            openAiKey: 'NONE',
          },
          nativeApi: {
            readdir: mock.fn(async () => ([])),
            readTextFile: mock.fn(async () => 'test'),
            readBinaryFile: mock.fn(async () => new Blob([])),
            writeTextFile: mock.fn(async () => {}),
          }
        });
        const duration = Date.now() - startTime;
        assert.ok(duration < 1000, 'Expected long-running node to abort immediately');
      } catch (err) {
        assert.fail(err);
      }
    })
  });
});
