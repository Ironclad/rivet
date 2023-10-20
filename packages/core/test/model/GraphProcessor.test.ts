import { it, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import { loadTestGraphInProcessor, testProcessContext } from '../testUtils';

describe('GraphProcessor', () => {
  it('Can run passthrough graph', async () => {
    const processor = await loadTestGraphInProcessor('Passthrough');

    const outputs = await processor.processGraph(testProcessContext(), {
      input: {
        type: 'string',
        value: 'input value',
      },
    });

    assert.deepEqual(outputs.output, {
      type: 'string',
      value: 'input value',
    });
  });

  it('Can stream graph processor events', async () => {
    const processor = await loadTestGraphInProcessor('Passthrough');

    processor.processGraph(testProcessContext(), {
      input: {
        type: 'string',
        value: 'input value',
      },
    });

    const eventNames: string[] = [];
    for await (const event of processor.events()) {
      if (event.type !== 'trace') {
        eventNames.push(event.type);
      }
    }

    assert.equal(eventNames[eventNames.length - 2], 'done');
    assert.equal(eventNames[eventNames.length - 1], 'finish');
  });
});
