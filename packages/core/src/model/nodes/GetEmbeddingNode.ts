import { ChartNode, NodeId, NodeInputDefinition, PortId, NodeOutputDefinition } from '../NodeBase';
import { EditorDefinition, NodeImpl, nodeDefinition } from '../NodeImpl';
import { nanoid } from 'nanoid';
import { Inputs, Outputs } from '../GraphProcessor';
import { InternalProcessContext } from '../ProcessContext';
import * as openai from 'openai';
import { coerceType, getIntegration } from '../..';

export type GetEmbeddingNode = ChartNode<'getEmbedding', GetEmbeddingNodeData>;

export type GetEmbeddingNodeData = {
  integration: string;
  useIntegrationInput?: boolean;
};

export class GetEmbeddingNodeImpl extends NodeImpl<GetEmbeddingNode> {
  static create(): GetEmbeddingNode {
    return {
      id: nanoid() as NodeId,
      type: 'getEmbedding',
      title: 'Get Embedding',
      visualData: { x: 0, y: 0, width: 200 },
      data: {
        integration: 'openai',
        useIntegrationInput: false,
      },
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

    if (this.data.useIntegrationInput) {
      inputDefinitions.push({
        id: 'integration' as PortId,
        title: 'Integration',
        dataType: 'string',
        required: true,
      });
    }

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
    return [
      {
        type: 'dropdown',
        label: 'Integration',
        dataKey: 'integration',
        options: [{ label: 'OpenAI', value: 'openai' }],
        useInputToggleDataKey: 'useIntegrationInput',
      },
    ];
  }

  getBody(): string | undefined {
    return `Using ${this.data.useIntegrationInput ? '(input)' : this.data.integration}`;
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const input = coerceType(inputs['input' as PortId], 'string');

    const integrationName = this.data.useIntegrationInput
      ? coerceType(inputs['integration' as PortId], 'string')
      : this.data.integration;

    const embeddingGenerator = getIntegration('embeddingGenerator', integrationName, context);

    const embedding = await embeddingGenerator.generateEmbedding(input);

    return {
      ['embedding' as PortId]: {
        type: 'vector',
        value: embedding,
      },
    };
  }
}

export const getEmbeddingNode = nodeDefinition(GetEmbeddingNodeImpl, 'Get Embedding');
