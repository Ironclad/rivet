import { it, describe, mock } from 'node:test';
import { strict as assert } from 'node:assert';
import { DataValue, ObjectNode, ObjectNodeImpl } from '../../../src/index.js';

const createNode = (data: Partial<ObjectNode['data']>) => {
  return new ObjectNodeImpl({
    ...ObjectNodeImpl.create(),
    data: {
      ...ObjectNodeImpl.create().data,
      ...data,
    },
  });
};

describe('ObjectNodeImpl', () => {
  it('can create node', () => {
    const node = ObjectNodeImpl.create();
    assert.strictEqual(node.type, 'object');
  });

  it('supports strings with quote characters', async () => {
    const node = createNode({ jsonTemplate: `{"key": "{{input}}"}` });
    const inputs: Record<string, DataValue> = {
      input: { type: 'string', value: 'You say "goodbye," I say "hello."' },
    };
    const result = await node.process(inputs);
    assert.deepStrictEqual(result['output'].value, { key: 'You say "goodbye," I say "hello."' });
  });

  it('supports strings strings without quote characters', async () => {
    // Note lack of double-quotes around {{inputs}}
    const node = createNode({ jsonTemplate: `{"key": {{input}} }` });
    const inputs: Record<string, DataValue> = {
      input: { type: 'string', value: 'You say "goodbye," I say "hello."' },
    };
    const result = await node.process(inputs);
    assert.deepStrictEqual(result['output'].value, { key: 'You say "goodbye," I say "hello."' });
  });

  it('turns any key surrounded by double-quotes into escaped strings', async () => {
    const node = createNode({ jsonTemplate: `{"key": "{{input}}"}` });
    const inputs: Record<string, DataValue> = {
      input: { type: 'object', value: { you: 'goodbye', me: 'hello' } },
    };
    const result = await node.process(inputs);

    const keyValue = (result['output'].value as any)['key'];
    assert.strictEqual(typeof keyValue, 'string');
    assert.deepStrictEqual(JSON.parse(keyValue), { you: 'goodbye', me: 'hello' });
  });

  it('does not escape objects', async () => {
    const node = createNode({ jsonTemplate: `{"key": {{input}}}` });
    const inputs: Record<string, DataValue> = {
      input: { type: 'object', value: { you: 'goodbye', me: 'hello' } },
    };
    const result = await node.process(inputs);

    assert.deepEqual(result['output'].value, { key: { you: 'goodbye', me: 'hello' } });
  });

  it('does not escape booleans', async () => {
    const node = createNode({ jsonTemplate: `{"key": {{input}}, "anotherKey": {{anotherInput}}}` });
    const inputs: Record<string, DataValue> = {
      input: { type: 'boolean', value: false },
      anotherInput: { type: 'boolean', value: true },
    };
    const result = await node.process(inputs);

    assert.deepStrictEqual(result['output'].value, { key: false, anotherKey: true });
  });

  it('does not escape numbers', async () => {
    const node = createNode({ jsonTemplate: `{"key": {{input}}, "anotherKey": {{anotherInput}}}` });
    const inputs: Record<string, DataValue> = {
      input: { type: 'number', value: 0 },
      anotherInput: { type: 'number', value: 2 },
    };
    const result = await node.process(inputs);

    assert.deepStrictEqual(result['output'].value, { key: 0, anotherKey: 2 });
  });

  it('does not escape arrays', async () => {
    const node = createNode({ jsonTemplate: `{"numArray": {{numArray}}, "strArray": {{strArray}}, "anyArray": {{anyArray}}, "objArray": {{objArray}}}` });
    const inputs: Record<string, DataValue> = {
      numArray: { type: 'number[]', value: [1, 2, 3] },
      strArray: { type: 'string[]', value: ['hello'] },
      anyArray: { type: 'any[]', value: ['world'] },
      objArray: { type: 'object[]', value: [] },
    };
    const result = await node.process(inputs);

    assert.deepEqual(result['output'].value, {
      numArray: [1, 2, 3],
      strArray: ['hello'],
      anyArray: ['world'],
      objArray: [],
    });
  });

  it('allows variables to be used multiple times, both escaped and unescaped', async () => {
    const node = createNode({ jsonTemplate: `{
      "obj": {{obj}},
      "objStr": "{{obj}}",
      "nested": {
        "obj": {{obj}}
      }
    }` });
    const inputs: Record<string, DataValue> = {
      obj: { type: 'object', value: { hello: 'world' } },
    };
    const result = await node.process(inputs);

    assert.deepStrictEqual(result['output'].value, {
      obj: { hello: 'world' },
      objStr: '{"hello":"world"}',
      nested: {
        obj: { hello: 'world' },
      },
    });
  });

  it('supports fully undefined inputs', async () => {
    const node = createNode({ jsonTemplate: `{"key": "{{input}}"}` });
    const inputs: Record<string, DataValue> = {
      input: undefined as any, // I believe this can happen when a split node has arrays of different lengths.
    };
    const result = await node.process(inputs);
    assert.deepStrictEqual(result['output'].value, { key: null });
  });
})
