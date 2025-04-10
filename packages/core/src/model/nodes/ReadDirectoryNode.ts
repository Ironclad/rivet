import {
  type ChartNode,
  type NodeId,
  type PortId,
  type NodeInputDefinition,
  type NodeOutputDefinition,
} from '../NodeBase.js';
import { NodeImpl, type NodeUIData } from '../NodeImpl.js';
import { nodeDefinition } from '../NodeDefinition.js';
import { nanoid } from 'nanoid/non-secure';
import { type Inputs, type Outputs } from '../GraphProcessor.js';
import { type NodeBodySpec } from '../../index.js';
import { type InternalProcessContext } from '../ProcessContext.js';
import { dedent } from 'ts-dedent';
import { createTreeFromPaths } from '../../utils/paths.js';
import { getInputOrData } from '../../utils/inputs.js';

export type ReadDirectoryNode = ChartNode<'readDirectory', ReadDirectoryNodeData>;

type ReadDirectoryNodeData = {
  path: string;
  usePathInput: boolean;

  recursive: boolean;
  useRecursiveInput: boolean;

  includeDirectories: boolean;
  useIncludeDirectoriesInput: boolean;

  filterGlobs: string[];
  useFilterGlobsInput: boolean;

  relative: boolean;
  useRelativeInput: boolean;

  ignores?: string[];
  useIgnoresInput: boolean;
};

export class ReadDirectoryNodeImpl extends NodeImpl<ReadDirectoryNode> {
  static create(): ReadDirectoryNode {
    return {
      id: nanoid() as NodeId,
      type: 'readDirectory',
      title: 'Read Directory',
      visualData: { x: 0, y: 0 },
      data: {
        path: 'examples',
        recursive: false,
        usePathInput: false,
        useRecursiveInput: false,
        includeDirectories: false,
        useIncludeDirectoriesInput: false,
        filterGlobs: [],
        useFilterGlobsInput: false,
        relative: false,
        useRelativeInput: false,
        ignores: [],
        useIgnoresInput: false,
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

    if (this.chartNode.data.useIncludeDirectoriesInput) {
      inputDefinitions.push({
        id: 'includeDirectories' as PortId,
        title: 'Include Directories',
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

    if (this.chartNode.data.useRelativeInput) {
      inputDefinitions.push({
        id: 'relative' as PortId,
        title: 'Relative',
        dataType: 'boolean',
        required: true,
        coerced: false,
      });
    }

    return inputDefinitions;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'rootPath' as PortId,
        title: 'Root Path',
        dataType: 'string',
      },
      {
        id: 'paths' as PortId,
        title: 'Paths',
        dataType: 'string[]',
      },
      {
        id: 'tree' as PortId,
        title: 'Tree',
        dataType: 'object',
      },
    ];
  }

  getBody(): string | NodeBodySpec | undefined {
    return dedent`
      Path: ${this.data.usePathInput ? '(Input)' : this.data.path}
      Recursive: ${this.data.useRecursiveInput ? '(Input)' : this.data.recursive}
      Include Directories: ${this.data.useIncludeDirectoriesInput ? '(Input)' : this.data.includeDirectories}
      Relative: ${this.data.useRelativeInput ? '(Input)' : this.data.relative}
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
        Reads the contents of the specified directory and outputs:
        1. An array of filenames
        2. The root path of the search
        3. A tree structure representing the directory hierarchy
      `,
      infoBoxTitle: 'Read Directory Node',
      contextMenuTitle: 'Read Directory',
      group: ['Input/Output'],
    };
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const { nativeApi } = context;

    if (nativeApi == null) {
      throw new Error('This node requires a native API to run.');
    }

    const path = getInputOrData(this.data, inputs, 'path');
    const recursive = getInputOrData(this.data, inputs, 'recursive', 'boolean');
    const includeDirectories = getInputOrData(this.data, inputs, 'includeDirectories', 'boolean');
    const filterGlobs = getInputOrData(this.data, inputs, 'filterGlobs', 'string[]');
    const relative = getInputOrData(this.data, inputs, 'relative', 'boolean');
    const ignores = getInputOrData(this.data, inputs, 'ignores', 'string[]');

    try {
      const files = await nativeApi.readdir(path, undefined, {
        recursive,
        includeDirectories,
        filterGlobs,
        relative,
        ignores,
      });

      const tree = createTreeFromPaths(files, path);

      return {
        ['paths' as PortId]: { type: 'string[]', value: files },
        ['rootPath' as PortId]: { type: 'string', value: path },
        ['tree' as PortId]: { type: 'object', value: tree as unknown as Record<string, unknown> },
      };
    } catch (err) {
      return {
        ['paths' as PortId]: { type: 'string[]', value: ['(no such path)'] },
        ['rootPath' as PortId]: { type: 'string', value: path },
        ['tree' as PortId]: {
          type: 'object',
          value: {
            path,
            name: path.split('/').pop() || path,
            isDirectory: true,
            children: [],
          },
        },
      };
    }
  }
}

export const readDirectoryNode = nodeDefinition(ReadDirectoryNodeImpl, 'Read Directory');
