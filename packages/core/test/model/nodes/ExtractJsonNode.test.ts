import { it, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import { ExtractJsonNodeImpl, NodeId } from '../../../src/index.js';
import { nanoid } from 'nanoid/non-secure';

const createNode = () => {
  return new ExtractJsonNodeImpl({
    ...ExtractJsonNodeImpl.create(),
  });
};

describe('ExtractJsonNodeImpl', () => {
  it('can create node', () => {
    const node = ExtractJsonNodeImpl.create();
    assert.strictEqual(node.type, 'extractJson');
  });

  it('has one input and two outputs', () => {
    const node = new ExtractJsonNodeImpl(ExtractJsonNodeImpl.create());
    assert.strictEqual(node.getInputDefinitions().length, 1);
    assert.strictEqual(node.getOutputDefinitions().length, 2);
  });

  it('creates nodes with unique IDs', () => {
    const node1 = ExtractJsonNodeImpl.create();
    const node2 = ExtractJsonNodeImpl.create();
    assert.notStrictEqual(node1.id, node2.id);
  });

  it('processes valid object JSON input correctly', async () => {
    const node = createNode();
    const inputs = {
      input: { type: 'string', value: '{"key": "value"}' },
    };
    const result = await node.process(inputs);
    assert.deepStrictEqual(result['output'].value, { key: 'value' });
    assert.strictEqual(result['noMatch'].type, 'control-flow-excluded');
  });

  it('processes valid number JSON input correctly', async () => {
    const node = createNode();
    const inputs = {
      input: { type: 'string', value: '1' },
    };
    const result = await node.process(inputs);
    assert.deepStrictEqual(result['output'].value, 1);
    assert.strictEqual(result['noMatch'].type, 'control-flow-excluded');
  });

  it('processes valid null JSON input correctly', async () => {
    const node = createNode();
    const inputs = {
      input: { type: 'string', value: 'null' },
    };
    const result = await node.process(inputs);
    assert.deepStrictEqual(result['output'].value, null);
    assert.strictEqual(result['noMatch'].type, 'control-flow-excluded');
  });

  it('processes valid string JSON input correctly', async () => {
    const node = createNode();
    const inputs = {
      input: { type: 'string', value: '"string"' },
    };
    const result = await node.process(inputs);
    assert.deepStrictEqual(result['output'].value, 'string');
    assert.strictEqual(result['noMatch'].type, 'control-flow-excluded');
  });

  it('processes valid boolean JSON input correctly', async () => {
    const node = createNode();
    const inputs = {
      input: { type: 'string', value: 'true' },
    };
    const result = await node.process(inputs);
    assert.deepStrictEqual(result['output'].value, true);
    assert.strictEqual(result['noMatch'].type, 'control-flow-excluded');
  });

  it('processes valid array JSON input correctly', async () => {
    const node = createNode();
    const inputs = {
      input: { type: 'string', value: '[1,2,3]' },
    };
    const result = await node.process(inputs);
    assert.deepStrictEqual(result['output'].value, [1, 2, 3]);
    assert.strictEqual(result['noMatch'].type, 'control-flow-excluded');
  });

  it('processes valid wrapped array JSON input correctly', async () => {
    const node = createNode();
    const inputs = {
      input: {
        type: 'string',
        value: `
          \`\`\`json
          [1, 2, 3]
          \`\`\`
      `,
      },
    };
    const result = await node.process(inputs);
    assert.deepStrictEqual(result['output'].value, [1, 2, 3]);
    assert.strictEqual(result['noMatch'].type, 'control-flow-excluded');
  });

  it('processes valid wrapped object JSON input correctly', async () => {
    const node = createNode();
    const inputs = {
      input: {
        type: 'string',
        value: `
          \`\`\`json
          {"key": "value"}
          \`\`\`
      `,
      },
    };
    const result = await node.process(inputs);
    assert.deepStrictEqual(result['output'].value, { key: 'value' });
    assert.strictEqual(result['noMatch'].type, 'control-flow-excluded');
  });

  it('processes invalid JSON input correctly', async () => {
    const node = createNode();
    const inputs = {
      input: { type: 'string', value: 'invalid' },
    };
    const result = await node.process(inputs);
    assert.strictEqual(result['output'].type, 'control-flow-excluded');
    assert.strictEqual(result['noMatch'].value, 'invalid');
  });

  it('processes complex object JSON input correctly', async () => {
    const node = createNode();
    const inputs = {
      input: { type: 'string', value: '{"key": {"subKey": "value"}}' },
    };
    const result = await node.process(inputs);
    assert.deepStrictEqual(result['output'].value, { key: { subKey: 'value' } });
    assert.strictEqual(result['noMatch'].type, 'control-flow-excluded');
  });

  it('processes JSON array input correctly', async () => {
    const node = createNode();
    const inputs = {
      input: { type: 'string', value: '[1,2,3]' },
    };
    const result = await node.process(inputs);
    assert.deepStrictEqual(result['output'].value, [1, 2, 3]);
    assert.strictEqual(result['noMatch'].type, 'control-flow-excluded');
  });
});
