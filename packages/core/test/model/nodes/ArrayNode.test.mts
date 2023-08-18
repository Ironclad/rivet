import { it, describe, mock } from 'node:test';
import { strict as assert } from 'node:assert';
import { ArrayNode, ArrayNodeImpl, NodeConnection, NodeId } from '../../../src/index.js';
import { nanoid } from 'nanoid/non-secure';

const createNode = (data: Partial<ArrayNode['data']>) => {
  return new ArrayNodeImpl({
    ...ArrayNodeImpl.create(),
    data: {
      ...ArrayNodeImpl.create().data,
      ...data,
    },
  });
};

describe('ArrayNodeImpl', () => {
  it('can create node', () => {
    const node = ArrayNodeImpl.create();
    assert.strictEqual(node.type, 'array');
  });

  it('defaults to flatten true and flattenDeep false', () => {
    const node = ArrayNodeImpl.create();
    assert.strictEqual(node.data.flatten, true);
    assert.strictEqual(node.data.flattenDeep, false);
  });

  it('has dynamic input definitions based on connections', () => {
    const node = createNode({ flatten: true, flattenDeep: false });
    const connections = [{ inputNodeId: node.id, inputId: 'input1' } as NodeConnection];
    assert.strictEqual(node.getInputDefinitions(connections).length, 2);
  });

  it('has three outputs', () => {
    const node = new ArrayNodeImpl(ArrayNodeImpl.create());
    assert.strictEqual(node.getOutputDefinitions().length, 3);
  });

  it('returns editor definitions for data', () => {
    const node = new ArrayNodeImpl(ArrayNodeImpl.create());
    const editors = node.getEditors();

    assert.ok(editors.find((e) => e.dataKey === 'flatten'));
    assert.ok(editors.find((e) => e.dataKey === 'flattenDeep'));
  });

  it('creates nodes with unique IDs', () => {
    const node1 = ArrayNodeImpl.create();
    const node2 = ArrayNodeImpl.create();
    assert.notStrictEqual(node1.id, node2.id);
  });

  it('processes inputs correctly when flatten is true', async () => {
    const node = createNode({ flatten: true, flattenDeep: false });
    const inputs = {
      input1: { type: 'any', value: [1, 2] },
      input2: { type: 'any', value: [3, 4] },
    };
    const result = await node.process(inputs);
    assert.deepStrictEqual(result['output'].value, [1, 2, 3, 4]);
    assert.deepStrictEqual(result['indices'].value, [0, 1, 2, 3]);
    assert.strictEqual(result['length'].value, 4);
  });

  it('processes inputs correctly when flatten is false', async () => {
    const node = createNode({ flatten: false, flattenDeep: false });
    const inputs = {
      input1: { type: 'any', value: [1, 2] },
      input2: { type: 'any', value: [3, 4] },
    };
    const result = await node.process(inputs);
    assert.deepStrictEqual(result['output'].value, [
      [1, 2],
      [3, 4],
    ]);
    assert.deepStrictEqual(result['indices'].value, [0, 1]);
    assert.strictEqual(result['length'].value, 2);
  });

  it('processes inputs correctly when flattenDeep is true', async () => {
    const node = createNode({ flatten: true, flattenDeep: true });
    const inputs = {
      input1: { type: 'any', value: [1, [2, 3]] },
      input2: { type: 'any', value: [[4, 5], 6] },
    };
    const result = await node.process(inputs);
    assert.deepStrictEqual(result['output'].value, [1, 2, 3, 4, 5, 6]);
    assert.deepStrictEqual(result['indices'].value, [0, 1, 2, 3, 4, 5]);
    assert.strictEqual(result['length'].value, 6);
  });

  it('processes non-array inputs correctly when flatten is true', async () => {
    const node = createNode({ flatten: true, flattenDeep: false });
    const inputs = {
      input1: { type: 'any', value: 'hello' },
      input2: { type: 'any', value: 'world' },
    };
    const result = await node.process(inputs);
    assert.deepStrictEqual(result['output'].value, ['hello', 'world']);
    assert.deepStrictEqual(result['indices'].value, [0, 1]);
    assert.strictEqual(result['length'].value, 2);
  });

  it('processes non-array inputs correctly when flatten is false', async () => {
    const node = createNode({ flatten: false, flattenDeep: false });
    const inputs = {
      input1: { type: 'any', value: 'hello' },
      input2: { type: 'any', value: 'world' },
    };
    const result = await node.process(inputs);
    assert.deepStrictEqual(result['output'].value, ['hello', 'world']);
    assert.deepStrictEqual(result['indices'].value, [0, 1]);
    assert.strictEqual(result['length'].value, 2);
  });

  it('processes inputs correctly when flattenDeep is true and inputs are deeply nested', async () => {
    const node = createNode({ flatten: true, flattenDeep: true });
    const inputs = {
      input1: { type: 'any', value: [1, [2, [3, [4, [5, 6]]]]] },
      input2: { type: 'any', value: [[7, 8], 9] },
    };
    const result = await node.process(inputs);
    assert.deepStrictEqual(result['output'].value, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
    assert.deepStrictEqual(result['indices'].value, [0, 1, 2, 3, 4, 5, 6, 7, 8]);
    assert.strictEqual(result['length'].value, 9);
  });

  it('getInputDefinitions returns correct number of inputs', () => {
    const node = createNode({ flatten: true, flattenDeep: false });
    const connections = [
      { inputNodeId: node.id, inputId: 'input1' } as NodeConnection,
      { inputNodeId: node.id, inputId: 'input2' } as NodeConnection,
      { inputNodeId: node.id, inputId: 'input3' } as NodeConnection,
    ];
    assert.strictEqual(node.getInputDefinitions(connections).length, 4);
  });

  it('getInputDefinitions returns correct input IDs', () => {
    const node = createNode({ flatten: true, flattenDeep: false });
    const connections = [
      { inputNodeId: node.id, inputId: 'input1' } as NodeConnection,
      { inputNodeId: node.id, inputId: 'input2' } as NodeConnection,
      { inputNodeId: node.id, inputId: 'input3' } as NodeConnection,
    ];
    const inputDefinitions = node.getInputDefinitions(connections);
    assert.strictEqual(inputDefinitions[0].id, 'input1');
    assert.strictEqual(inputDefinitions[1].id, 'input2');
    assert.strictEqual(inputDefinitions[2].id, 'input3');
    assert.strictEqual(inputDefinitions[3].id, 'input4');
  });
});
