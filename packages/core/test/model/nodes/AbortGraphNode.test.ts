import { it, describe, mock } from 'node:test';
import { strict as assert } from 'node:assert';

import { AbortGraphNode, AbortGraphNodeImpl, InternalProcessContext, PortId } from '../../../src/index.js';

const createNode = (data: Partial<AbortGraphNode['data']>) => {
  return new AbortGraphNodeImpl({
    ...AbortGraphNodeImpl.create(),
    data: {
      ...AbortGraphNodeImpl.create().data,
      ...data,
    },
  });
};

describe('AbortGraphNode', () => {
  it('can create node', () => {
    const node = AbortGraphNodeImpl.create();
    assert.strictEqual(node.type, 'abortGraph');
  });

  it('defaults to successfully true', () => {
    const node = AbortGraphNodeImpl.create();
    assert.strictEqual(node.data.successfully, true);
  });

  it('has one input if useSuccessfullyInput is false', () => {
    const node = new AbortGraphNodeImpl(AbortGraphNodeImpl.create());
    assert.strictEqual(node.getInputDefinitions().length, 1);
  });

  it('has two inputs if useSuccessfullyInput is true', () => {
    const node = createNode({ useSuccessfullyInput: true });
    assert.strictEqual(node.getInputDefinitions().length, 2);
  });

  it('has no outputs', () => {
    const node = new AbortGraphNodeImpl(AbortGraphNodeImpl.create());
    assert.strictEqual(node.getOutputDefinitions().length, 0);
  });

  it('returns correct body when successfully aborting', () => {
    const node = createNode({ successfully: true });
    assert.strictEqual(node.getBody(), 'Successfully Abort');
  });

  it('returns correct body when error aborting with message', () => {
    const node = createNode({ successfully: false, errorMessage: 'Test Error' });
    assert.strictEqual(node.getBody(), 'Error Abort: Test Error');
  });

  it('returns correct body when error aborting without message', () => {
    const node = createNode({ successfully: false });
    assert.strictEqual(node.getBody(), 'Error Abort');
  });

  it('returns correct body when success depends on input', () => {
    const node = createNode({ useSuccessfullyInput: true });
    assert.strictEqual(node.getBody(), 'Success depends on input');
  });

  it('processes successfully abort', async () => {
    const node = createNode({ successfully: true });
    const abortGraph = mock.fn((_error?: Error | string) => {});
    const context = { abortGraph: abortGraph as () => void } as InternalProcessContext;
    const result = await node.process({}, context);
    assert.deepStrictEqual(result, {});
    assert.strictEqual(abortGraph.mock.calls.length, 1);
    assert.strictEqual(abortGraph.mock.calls[0]!.arguments[0]!, undefined);
  });

  it('processes error abort with message', async () => {
    const node = createNode({ successfully: false, errorMessage: 'Test Error' });
    const abortGraph = mock.fn((_error?: Error | string) => {});
    const context = { abortGraph: abortGraph as () => void } as InternalProcessContext;
    const result = await node.process({}, context);
    assert.deepStrictEqual(result, {});
    assert.strictEqual(abortGraph.mock.calls.length, 1);
    assert.strictEqual(abortGraph.mock.calls[0]!.arguments[0]!, 'Test Error');
  });

  it('processes successfully abort when useSuccessfullyInput is true and input is true', async () => {
    const node = createNode({ useSuccessfullyInput: true });
    const abortGraph = mock.fn((_error?: Error | string) => {});
    const context = { abortGraph: abortGraph as () => void } as InternalProcessContext;
    const result = await node.process({ ['successfully' as PortId]: { type: 'boolean', value: true } }, context);
    assert.deepStrictEqual(result, {});
    assert.strictEqual(abortGraph.mock.calls.length, 1);
    assert.strictEqual(abortGraph.mock.calls[0]!.arguments[0]!, undefined);
  });

  it('processes error abort with input message', async () => {
    const node = createNode({ successfully: false });
    const abortGraph = mock.fn((_error?: Error | string) => {});
    const context = { abortGraph: abortGraph as () => void } as InternalProcessContext;
    const result = await node.process({ ['data' as PortId]: { type: 'string', value: 'Input Error' } }, context);
    assert.deepStrictEqual(result, {});
    assert.strictEqual(abortGraph.mock.calls.length, 1);
    assert.strictEqual(abortGraph.mock.calls[0]!.arguments[0]!, 'Input Error');
  });

  it('returns editor definitions for data', (t) => {
    const node = new AbortGraphNodeImpl(AbortGraphNodeImpl.create());
    const editors = node.getEditors();

    assert.ok(editors.find((e) => e.dataKey === 'successfully'));
    assert.ok(editors.find((e) => e.dataKey === 'errorMessage'));
  });

  it('creates nodes with unique IDs', (t) => {
    const node1 = AbortGraphNodeImpl.create();
    const node2 = AbortGraphNodeImpl.create();
    assert.notStrictEqual(node1.id, node2.id);
  });

  it('correctly coerces successfully input to boolean when useSuccessfullyInput is true', async () => {
    const node = createNode({ useSuccessfullyInput: true });
    const abortGraph = mock.fn((_error?: Error | string) => {});
    const context = { abortGraph: abortGraph as () => void } as InternalProcessContext;
    const result = await node.process({ ['successfully' as PortId]: { type: 'string', value: 'true' } }, context);
    assert.deepStrictEqual(result, {});
    assert.strictEqual(abortGraph.mock.calls.length, 1);
    assert.strictEqual(abortGraph.mock.calls[0]!.arguments[0]!, undefined);
  });

  it('correctly coerces successfully input to boolean when useSuccessfullyInput is true', async () => {
    const node = createNode({ useSuccessfullyInput: true, errorMessage: 'Test Error' });
    const abortGraph = mock.fn((_error?: Error | string) => {});
    const context = { abortGraph: abortGraph as () => void } as InternalProcessContext;
    const result = await node.process({ ['successfully' as PortId]: { type: 'string', value: 'false' } }, context);
    assert.deepStrictEqual(result, {});
    assert.strictEqual(abortGraph.mock.calls.length, 1);
    assert.strictEqual(abortGraph.mock.calls[0]!.arguments[0]!, 'Test Error');
  });

  it('correctly coerces data input to string when successfully is false', async () => {
    const node = createNode({ successfully: false });
    const abortGraph = mock.fn((_error?: Error | string) => {});
    const context = { abortGraph: abortGraph as () => void } as InternalProcessContext;
    const result = await node.process({ ['data' as PortId]: { type: 'number', value: 123 } }, context);
    assert.deepStrictEqual(result, {});
    assert.strictEqual(abortGraph.mock.calls.length, 1);
    assert.strictEqual(abortGraph.mock.calls[0]!.arguments[0]!, '123');
  });

  it('falls back to errorMessage when data input is missing', async () => {
    const node = createNode({ successfully: false, errorMessage: 'Test Error' });
    const abortGraph = mock.fn((_error?: Error | string) => {});
    const context = { abortGraph: abortGraph as () => void } as InternalProcessContext;
    const result = await node.process({ ['data' as PortId]: { type: 'any', value: undefined } }, context);
    assert.deepStrictEqual(result, {});
    assert.strictEqual(abortGraph.mock.calls.length, 1);
    assert.strictEqual(abortGraph.mock.calls[0]!.arguments[0]!, 'Test Error');
  });

  it('falls back to successfully data value when useSuccessfullyInput is true but no input is provided', async () => {
    const node = createNode({ useSuccessfullyInput: true, successfully: false });
    const abortGraph = mock.fn((_error?: Error | string) => {});
    const context = { abortGraph: abortGraph as () => void } as InternalProcessContext;
    const result = await node.process({}, context);
    assert.deepStrictEqual(result, {});
    assert.strictEqual(abortGraph.mock.calls.length, 1);
    assert.strictEqual(abortGraph.mock.calls[0]!.arguments[0]!, 'Graph aborted with error');
  });

  it('uses default error message when successfully is false but no data input or errorMessage is provided', async () => {
    const node = createNode({ successfully: false });
    const abortGraph = mock.fn((_error?: Error | string) => {});
    const context = { abortGraph: abortGraph as () => void } as InternalProcessContext;
    const result = await node.process({}, context);
    assert.deepStrictEqual(result, {});
    assert.strictEqual(abortGraph.mock.calls.length, 1);
    assert.strictEqual(abortGraph.mock.calls[0]!.arguments[0]!, 'Graph aborted with error');
  });

  it('prefers data input over errorMessage when successfully is false and both are provided', async () => {
    const node = createNode({ successfully: false, errorMessage: 'Test Error' });
    const abortGraph = mock.fn((_error?: Error | string) => {});
    const context = { abortGraph: abortGraph as () => void } as InternalProcessContext;
    const result = await node.process({ ['data' as PortId]: { type: 'string', value: 'Input Error' } }, context);
    assert.deepStrictEqual(result, {});
    assert.strictEqual(abortGraph.mock.calls.length, 1);
    assert.strictEqual(abortGraph.mock.calls[0]!.arguments[0]!, 'Input Error');
  });
});
