import { ChartNode, NodeId, NodeInputDefinition, PortId, NodeOutputDefinition } from '../NodeBase';
import { nanoid } from 'nanoid';
import { EditorDefinition, NodeImpl, nodeDefinition } from '../NodeImpl';
import { DataValue } from '../DataValue';
import { Inputs, Outputs, coerceType, expectType } from '../..';
import sha256 from 'crypto-js/sha256';
import sha512 from 'crypto-js/sha512';
import md5 from 'crypto-js/md5';
import sha1 from 'crypto-js/sha1';
import { match } from 'ts-pattern';

export type HashNode = ChartNode<'hash', HashNodeData>;

export type HashNodeData = {
  algorithm: 'md5' | 'sha1' | 'sha256' | 'sha512';
};

export class HashNodeImpl extends NodeImpl<HashNode> {
  static create(): HashNode {
    const chartNode: HashNode = {
      type: 'hash',
      title: 'Hash',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 250,
      },
      data: {
        algorithm: 'sha256',
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    return [
      {
        id: 'input' as PortId,
        title: 'Input',
        dataType: 'string',
        required: true,
      },
    ];
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'hash' as PortId,
        title: 'Hash',
        dataType: 'string',
      },
    ];
  }

  getEditors(): EditorDefinition<HashNode>[] {
    return [
      {
        type: 'dropdown',
        label: 'Algorithm',
        dataKey: 'algorithm',
        options: [
          { value: 'md5', label: 'MD5' },
          { value: 'sha1', label: 'SHA1' },
          { value: 'sha256', label: 'SHA256' },
          { value: 'sha512', label: 'SHA512' },
        ],
      },
    ];
  }

  getBody(): string | undefined {
    return algorithmDisplayName[this.data.algorithm];
  }

  async process(inputs: Inputs): Promise<Outputs> {
    const inputText = coerceType(inputs['input' as PortId], 'string');

    const hash = match(this.data.algorithm)
      .with('md5', () => md5(inputText).toString())
      .with('sha1', () => sha1(inputText).toString())
      .with('sha256', () => sha256(inputText).toString())
      .with('sha512', () => sha512(inputText).toString())
      .exhaustive();

    return {
      ['hash' as PortId]: {
        type: 'string',
        value: hash,
      },
    };
  }
}

const algorithmDisplayName: Record<HashNodeData['algorithm'], string> = {
  md5: 'MD5',
  sha1: 'SHA-1',
  sha256: 'SHA-256',
  sha512: 'SHA-512',
};

export const hashNode = nodeDefinition(HashNodeImpl, 'Hash');
