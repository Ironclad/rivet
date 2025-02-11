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
import type { Inputs } from '../GraphProcessor.js';
import { uint8ArrayToBase64 } from '../../utils/base64.js';

export type ReadAllFilesNode = ChartNode<'readAllFiles', ReadAllFilesNodeData>;

type ReadAllFilesNodeData = {
  path: string;
  usePathInput: boolean;

  recursive: boolean;
  useRecursiveInput: boolean;

  filterGlobs: string[];
  useFilterGlobsInput: boolean;

  ignores?: string[];
  useIgnoresInput: boolean;

  asBinary?: boolean;
  errorOnMissingFile?: boolean;
};

type FileOutput = {
  path: string;
  content: string | Uint8Array;
};

export class ReadAllFilesNodeImpl extends NodeImpl<ReadAllFilesNode> {
  static create(): ReadAllFilesNode {
    return {
      id: nanoid() as NodeId,
      type: 'readAllFiles',
      title: 'Read All Files',
      visualData: { x: 0, y: 0, width: 250 },
      data: {
        path: '',
        usePathInput: false,
        recursive: false,
        useRecursiveInput: false,
        filterGlobs: [],
        useFilterGlobsInput: false,
        ignores: [],
        useIgnoresInput: false,
        asBinary: false,
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
        required: true,
        coerced: false,
      });
    }

    if (this.chartNode.data.useRecursiveInput) {
      inputDefinitions.push({
        id: 'recursive' as PortId,
        title: 'Recursive',
        dataType: 'boolean',
        required: true,
        coerced: false,
      });
    }

    if (this.chartNode.data.useFilterGlobsInput) {
      inputDefinitions.push({
        id: 'filterGlobs' as PortId,
        title: 'Filter Globs',
        dataType: 'string[]',
        required: true,
        coerced: false,
      });
    }

    if (this.chartNode.data.useIgnoresInput) {
      inputDefinitions.push({
        id: 'ignores' as PortId,
        title: 'Ignores',
        dataType: 'string[]',
        required: true,
        coerced: false,
      });
    }

    return inputDefinitions;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'files' as PortId,
        title: 'Files',
        dataType: 'object[]',
      },
      {
        id: 'rootPath' as PortId,
        title: 'Root Path',
        dataType: 'string',
      },
    ];
  }

  getEditors(): EditorDefinition<ReadAllFilesNode>[] {
    return [
      {
        type: 'directoryBrowser',
        label: 'Path',
        dataKey: 'path',
        useInputToggleDataKey: 'usePathInput',
      },
      {
        type: 'toggle',
        label: 'Recursive',
        dataKey: 'recursive',
        useInputToggleDataKey: 'useRecursiveInput',
      },
      {
        type: 'stringList',
        label: 'Filter Globs',
        dataKey: 'filterGlobs',
        useInputToggleDataKey: 'useFilterGlobsInput',
      },
      {
        type: 'stringList',
        label: 'Ignores',
        dataKey: 'ignores',
        useInputToggleDataKey: 'useIgnoresInput',
      },
      {
        type: 'toggle',
        label: 'Read as Binary',
        dataKey: 'asBinary',
      },
      {
        type: 'toggle',
        label: 'Error on Missing File',
        dataKey: 'errorOnMissingFile',
      },
    ];
  }

  getBody(): NodeBody {
    return dedent`
      ${this.data.asBinary ? 'Read as Binary' : 'Read as Text'}
      Path: ${this.data.usePathInput ? '(Input)' : this.data.path}
      Recursive: ${this.data.useRecursiveInput ? '(Input)' : this.data.recursive}
      Filters: ${
        this.data.useFilterGlobsInput
          ? '(Input)'
          : this.data.filterGlobs.length > 0
            ? this.data.filterGlobs.join(', ')
            : 'None'
      }
    `;
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Reads all files in the specified directory and outputs an array of objects containing each file's path and contents.
        Each object has a 'path' (string) and 'content' (string or binary) property.
      `,
      infoBoxTitle: 'Read All Files Node',
      contextMenuTitle: 'Read All Files',
      group: ['Input/Output'],
    };
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Record<PortId, DataValue>> {
    const { nativeApi } = context;

    if (nativeApi == null) {
      throw new Error('This node requires a native API to run.');
    }

    const path = getInputOrData(this.chartNode.data, inputs, 'path');

    const recursive = getInputOrData(this.data, inputs, 'recursive', 'boolean');
    const filterGlobs = getInputOrData(this.data, inputs, 'filterGlobs', 'string[]');
    const ignores = getInputOrData(this.data, inputs, 'ignores', 'string[]');

    try {
      // First read the directory
      const filePaths = await nativeApi.readdir(path, undefined, {
        recursive,
        includeDirectories: false, // We only want files since we're reading contents
        filterGlobs,
        relative: true, // Always use relative paths in output
        ignores,
      });

      // Then read each file
      const filePromises = filePaths.map(async (filePath): Promise<FileOutput> => {
        try {
          if (this.data.asBinary) {
            const content = await nativeApi.readBinaryFile(`${path}/${filePath}`);
            const buffer = await content.arrayBuffer();
            return {
              path: filePath,
              content: (await uint8ArrayToBase64(new Uint8Array(buffer))) ?? '',
            };
          } else {
            const content = await nativeApi.readTextFile(`${path}/${filePath}`, undefined);
            return {
              path: filePath,
              content,
            };
          }
        } catch (err) {
          if (this.chartNode.data.errorOnMissingFile) {
            throw err;
          }
          return {
            path: filePath,
            content: this.data.asBinary ? new Uint8Array() : '',
          };
        }
      });

      const files = await Promise.all(filePromises);

      return {
        ['files' as PortId]: { type: 'object[]', value: files },
        ['rootPath' as PortId]: { type: 'string', value: path },
      };
    } catch (err) {
      if (this.chartNode.data.errorOnMissingFile) {
        throw err;
      }
      return {
        ['files' as PortId]: { type: 'object[]', value: [] },
        ['rootPath' as PortId]: { type: 'string', value: path },
      };
    }
  }
}

export const readAllFilesNode = nodeDefinition(ReadAllFilesNodeImpl, 'Read All Files');
