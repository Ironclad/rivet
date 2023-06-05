import { ChartNode, NodeId, NodeInputDefinition, PortId, NodeOutputDefinition } from '../NodeBase';
import { nanoid } from 'nanoid';
import { EditorDefinition, NodeImpl, nodeDefinition } from '../NodeImpl';
import { DataValue } from '../DataValue';

export type ToolNode = ChartNode<'tool', ToolNodeData>;

export type ToolNodeData = {
  name: string;
  description: string;
  namespace?: string;
  schema: string;
};

export class ToolNodeImpl extends NodeImpl<ToolNode> {
  static create(): ToolNode {
    const chartNode: ToolNode = {
      type: 'tool',
      title: 'Tool',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 250,
      },
      data: {
        name: 'newTool',
        description: 'No description provided',
        schema: `{
  "type": "object",
  "properties": {}
}`,
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    return [];
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'tool' as PortId,
        title: 'Tool',
        dataType: 'gpt-tool',
      },
    ];
  }

  getEditors(): EditorDefinition<ToolNode>[] {
    return [
      {
        type: 'string',
        label: 'Name',
        dataKey: 'name',
      },
      {
        type: 'string',
        label: 'Description',
        dataKey: 'description',
      },
      {
        type: 'string',
        label: 'Namespace',
        dataKey: 'namespace',
      },
      {
        type: 'code',
        label: 'Schema',
        dataKey: 'schema',
        language: 'json',
      },
    ];
  }

  async process(inputs: Record<string, DataValue>): Promise<Record<string, DataValue>> {
    const parsedSchema = JSON.parse(this.data.schema);

    return {
      ['tool' as PortId]: {
        type: 'gpt-tool',
        value: {
          name: this.data.name,
          description: this.data.description,
          namespace: this.data.namespace,
          schema: parsedSchema,
        },
      },
    };
  }
}

export const toolNode = nodeDefinition(ToolNodeImpl, 'Tool');
