import { it, describe } from 'node:test';
import { strict as assert } from 'node:assert';

import { type NodeId } from '../../src/index.js';
import { NodeError, rivetErrorToString } from '../../src/utils/errors.js';

describe('rivetErrorToString', () => {
  it('should handle AggregateError', () => {
    const nodeError = new Error('Error 2');
    (nodeError as NodeError).node = {
      data: undefined,
      id: 'nodeId' as NodeId,
      title: 'Node title',
      type: 'type',
      visualData: {} as any, // Unused
    };

    assert.equal(
      rivetErrorToString(
        new AggregateError(
          [
            new Error('Error 1', { cause: new Error('Root cause') }), //
            nodeError,
            'Error 3',
            null,
          ],
          'Multiple errors',
        ),
      ),
      `
Multiple errors
 - Error 1
    Caused by: Root cause
 - Node title (nodeId): Error 2
 - Error 3
 - Unknown error
      `.trim(),
    );
  });
});
