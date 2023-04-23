import { ChartNode, NodeId, PortId } from '../NodeBase';
import { BaseDir, baseDirs } from '../native/BaseDir';
import { NodeConnection, NodeInputDefinition, NodeOutputDefinition } from '../NodeBase';
import { DataValue } from '../DataValue';
import { NodeImpl, ProcessContext } from '../NodeImpl';
import { nanoid } from 'nanoid';

export type ReadDirectoryNode = ChartNode<'readDirectory', ReadDirectoryNodeData>;

type ReadDirectoryNodeData = {
  baseDirectory: BaseDir;
  path: string;
  recursive: boolean;
};

export class ReadDirectoryNodeImpl extends NodeImpl<ReadDirectoryNode> {
  static create(): ReadDirectoryNode {
    return {
      id: nanoid() as NodeId,
      type: 'readDirectory',
      title: 'Read Directory',
      visualData: { x: 0, y: 0 },
      data: {
        baseDirectory: baseDirs.document,
        path: '',
        recursive: false,
      },
    };
  }

  getInputDefinitions(_connections: NodeConnection[]): NodeInputDefinition[] {
    return [];
  }

  getOutputDefinitions(_connections: NodeConnection[]): NodeOutputDefinition[] {
    return [
      {
        id: 'paths' as PortId,
        title: 'Paths',
        dataType: 'string[]',
      },
    ];
  }

  async process(_inputData: Record<string, DataValue>, context: ProcessContext): Promise<Record<string, DataValue>> {
    const files = await context.nativeApi.readdir(this.chartNode.data.path, this.chartNode.data.baseDirectory);
    return {
      ['paths' as PortId]: { type: 'string[]', value: files },
    };
  }
}
