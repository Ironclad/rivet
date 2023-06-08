import { ChartNode, NodeId, NodeInputDefinition, PortId, NodeOutputDefinition } from '../NodeBase';
import { EditorDefinition, NodeImpl, nodeDefinition } from '../NodeImpl';
import { nanoid } from 'nanoid';
import { Inputs, Outputs } from '../GraphProcessor';
import { InternalProcessContext } from '../ProcessContext';
import * as openai from 'openai';
import { coerceType } from '../..';

export type GetEmbeddingNode = ChartNode<'getEmbedding', GetEmbeddingNodeData>;

export type GetEmbeddingNodeData = {};

export class GetEmbeddingNodeImpl extends NodeImpl<GetEmbeddingNode> {
  static create(): GetEmbeddingNode {
    return {
      id: nanoid() as NodeId,
      type: 'getEmbedding',
      title: 'Get Embedding',
      visualData: { x: 0, y: 0, width: 200 },
      data: {},
    };
  }

  getInputDefinitions(): NodeInputDefinition[] {
    const inputDefinitions: NodeInputDefinition[] = [];

    inputDefinitions.push({
      id: 'input' as PortId,
      title: 'Input',
      dataType: 'string',
      required: true,
    });

    return inputDefinitions;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    const outputs: NodeOutputDefinition[] = [
      {
        id: 'embedding' as PortId,
        title: 'Embedding',
        dataType: 'vector',
      },
    ];

    return outputs;
  }

  getEditors(): EditorDefinition<GetEmbeddingNode>[] {
    return [];
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const input = coerceType(inputs['input' as PortId], 'string');

    const config = new openai.Configuration({
      apiKey: context.settings.openAiKey,
      organization: context.settings.openAiOrganization,
    });

    const api = new openai.OpenAIApi(config);

    const response = await api.createEmbedding({
      input,
      model: 'text-embedding-ada-002',
    });

    const { embedding } = response.data.data[0]!;

    return {
      ['embedding' as PortId]: {
        type: 'vector',
        value: embedding,
      },
    };
  }
}

export const getEmbeddingNode = nodeDefinition(GetEmbeddingNodeImpl, 'Get Embedding');
