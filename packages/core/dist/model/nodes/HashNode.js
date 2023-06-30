import { nanoid } from 'nanoid';
import { NodeImpl, nodeDefinition } from '../NodeImpl';
import { coerceType } from '../..';
import sha256 from 'crypto-js/sha256';
import sha512 from 'crypto-js/sha512';
import md5 from 'crypto-js/md5';
import sha1 from 'crypto-js/sha1';
import { match } from 'ts-pattern';
export class HashNodeImpl extends NodeImpl {
    static create() {
        const chartNode = {
            type: 'hash',
            title: 'Hash',
            id: nanoid(),
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
    getInputDefinitions() {
        return [
            {
                id: 'input',
                title: 'Input',
                dataType: 'string',
                required: true,
            },
        ];
    }
    getOutputDefinitions() {
        return [
            {
                id: 'hash',
                title: 'Hash',
                dataType: 'string',
            },
        ];
    }
    getEditors() {
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
    getBody() {
        return algorithmDisplayName[this.data.algorithm];
    }
    async process(inputs) {
        const inputText = coerceType(inputs['input'], 'string');
        const hash = match(this.data.algorithm)
            .with('md5', () => md5(inputText).toString())
            .with('sha1', () => sha1(inputText).toString())
            .with('sha256', () => sha256(inputText).toString())
            .with('sha512', () => sha512(inputText).toString())
            .exhaustive();
        return {
            ['hash']: {
                type: 'string',
                value: hash,
            },
        };
    }
}
const algorithmDisplayName = {
    md5: 'MD5',
    sha1: 'SHA-1',
    sha256: 'SHA-256',
    sha512: 'SHA-512',
};
export const hashNode = nodeDefinition(HashNodeImpl, 'Hash');
