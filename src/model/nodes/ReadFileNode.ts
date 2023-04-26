import { ChartNode, NodeId, PortId } from '../NodeBase';
import { BaseDir, assertBaseDir, baseDirs } from '../native/BaseDir';
import { NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { DataValue, expectType } from '../DataValue';
import { NodeImpl, ProcessContext } from '../NodeImpl';
import { nanoid } from 'nanoid';

export type ReadFileNode = ChartNode<'readFile', ReadFileNodeData>;

type ReadFileNodeData = {
  path: string;
  usePathInput: boolean;

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
      });
    }

    return inputDefinitions;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'content' as PortId,
        title: 'Content',
        dataType: 'string',
      },
    ];
  }

  async process(inputData: Record<PortId, DataValue>, context: ProcessContext): Promise<Record<PortId, DataValue>> {
    const path = this.chartNode.data.usePathInput
      ? expectType(inputData['path' as PortId], 'string')
      : this.chartNode.data.path;

    try {
      const content = await context.nativeApi.readTextFile(path, undefined);
      return {
        ['content' as PortId]: { type: 'string', value: content },
      };
    } catch (err) {
      if (this.chartNode.data.errorOnMissingFile) {
        throw err;
      } else {
        return {
          ['content' as PortId]: { type: 'string', value: '(no such file)' },
        };
      }
    }
  }
}
