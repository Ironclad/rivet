import {
  type ChartNode,
  type NodeId,
  type PortId,
  type NodeInputDefinition,
  type NodeOutputDefinition,
} from '../NodeBase.js';
import { type DataValue } from '../DataValue.js';
import { NodeImpl, type NodeBody, type NodeUIData } from '../NodeImpl.js';
import { nodeDefinition } from '../NodeDefinition.js';
import { nanoid } from 'nanoid/non-secure';
import { getInputOrData } from '../../utils/index.js';
import { type InternalProcessContext } from '../ProcessContext.js';
import { dedent } from 'ts-dedent';
import type { EditorDefinition } from '../EditorDefinition.js';
import type { RivetUIContext } from '../RivetUIContext.js';

export type ReadFileNode = ChartNode<'readFile', ReadFileNodeData>;

type ReadFileNodeData = {
  path: string;
  usePathInput: boolean;

  asBinary?: boolean;

  errorOnMissingFile?: boolean;
};

export class ReadFileNodeImpl extends NodeImpl<ReadFileNode> {
  static create(): ReadFileNode {
    return {
      id: nanoid() as NodeId,
      type: 'readFile',
      title: 'Read File',
      visualData: { x: 0, y: 0, width: 250 },
      data: {
        path: '',
        asBinary: false,
        usePathInput: true,
        errorOnMissingFile: false,
      },
    };
  }

  getInputDefinitions(): NodeInputDefinition[] {
    const inputDefinitions: NodeInputDefinition[] = [];

    if (this.chartNode.data.usePathInput) {
      inputDefinitions.push({
        id: 'path' as PortId,
        title: 'Path',
        dataType: 'string',
        coerced: false,
      });
    }

    return inputDefinitions;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'content' as PortId,
        title: 'Content',
        dataType: this.data.asBinary ? 'binary' : 'string',
      },
    ];
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Reads the contents of the specified file and outputs it as a string.
      `,
      infoBoxTitle: 'Read File Node',
      contextMenuTitle: 'Read File',
      group: ['Input/Output'],
    };
  }

  getEditors(): EditorDefinition<ReadFileNode>[] {
    return [
      {
        type: 'filePathBrowser',
        label: 'Path',
        dataKey: 'path',
        useInputToggleDataKey: 'usePathInput',
      },
      {
        type: 'toggle',
        label: 'Error on Missing File',
        dataKey: 'errorOnMissingFile',
      },
      {
        type: 'toggle',
        label: 'Read as Binary',
        dataKey: 'asBinary',
      },
    ];
  }

  getBody(): NodeBody {
    return dedent`
      ${this.data.asBinary ? 'Read as Binary' : 'Read as Text'}
      ${this.data.usePathInput ? '' : `Path: ${this.data.path}`}
    `;
  }

  async process(
    inputData: Record<PortId, DataValue>,
    context: InternalProcessContext,
  ): Promise<Record<PortId, DataValue>> {
    const { nativeApi } = context;

    if (nativeApi == null) {
      throw new Error('This node requires a native API to run.');
    }

    const path = getInputOrData(this.chartNode.data, inputData, 'path');

    try {
      if (this.data.asBinary) {
        const content = await nativeApi.readBinaryFile(path);
        const buffer = await content.arrayBuffer();
        return {
          ['content' as PortId]: { type: 'binary', value: new Uint8Array(buffer) },
        };
      } else {
        const content = await nativeApi.readTextFile(path, undefined);
        return {
          ['content' as PortId]: { type: 'string', value: content },
        };
      }
    } catch (err) {
      if (this.chartNode.data.errorOnMissingFile) {
        throw err;
      } else {
        return {
          ['content' as PortId]: { type: 'control-flow-excluded', value: undefined },
        };
      }
    }
  }
}

export const readFileNode = nodeDefinition(ReadFileNodeImpl, 'Read File');
