import {
  type ChartNode,
  type NodeId,
  type NodeInputDefinition,
  type PortId,
  type NodeOutputDefinition,
} from '../NodeBase.js';
import { nanoid } from 'nanoid/non-secure';
import { NodeImpl, type NodeUIData } from '../NodeImpl.js';
import { nodeDefinition } from '../NodeDefinition.js';
import { type EditorDefinition, type Inputs, type Outputs } from '../../index.js';
import * as crypto from 'crypto-js';
import { match } from 'ts-pattern';
import { dedent } from 'ts-dedent';
import { coerceType } from '../../utils/coerceType.js';

const { SHA256, SHA512, MD5, SHA1 } = crypto;

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

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Computes a hash of the input value using the configured hash function.
      `,
      infoBoxTitle: 'Hash Node',
      contextMenuTitle: 'Hash',
      group: ['Data'],
    };
  }

  async process(inputs: Inputs): Promise<Outputs> {
    const inputText = coerceType(inputs['input' as PortId], 'string');

    const hash = match(this.data.algorithm)
      .with('md5', () => MD5(inputText).toString())
      .with('sha1', () => SHA1(inputText).toString())
      .with('sha256', () => SHA256(inputText).toString())
      .with('sha512', () => SHA512(inputText).toString())
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
