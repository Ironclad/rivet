import { type ChartNode, type NodeId, type NodeInputDefinition, type NodeOutputDefinition } from '../NodeBase.js';
import { nanoid } from 'nanoid/non-secure';
import { NodeImpl, type NodeUIData } from '../NodeImpl.js';
import type { Inputs, Outputs } from '../GraphProcessor.js';
import { type InternalProcessContext } from '../ProcessContext.js';
import { type EditorDefinition } from '../../index.js';
import { dedent } from 'ts-dedent';
import { nodeDefinition } from '../NodeDefinition.js';
import { ChatNodeBase, type ChatNodeData } from './ChatNodeBase.js';

export type ChatNode = ChartNode<'chat', ChatNodeData>;

export class ChatNodeImpl extends NodeImpl<ChatNode> {
  static create(): ChatNode {
    const chartNode: ChatNode = {
      type: 'chat',
      title: 'Chat',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 200,
      },
      data: ChatNodeBase.defaultData(),
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    return ChatNodeBase.getInputDefinitions(this.data);
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return ChatNodeBase.getOutputDefinitions(this.data);
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Makes a call to an LLM chat model. Supports GPT and any OpenAI-compatible API. The settings contains many options for tweaking the model's behavior.

        The \`System Prompt\` input specifies a system prompt as the first message to the model. This is useful for providing context to the model.

        The \`Prompt\` input takes one or more strings or chat-messages (from a Prompt node) to send to the model.
      `,
      contextMenuTitle: 'Chat',
      infoBoxTitle: 'Chat Node',
      group: ['Common', 'AI'],
    };
  }

  getEditors(): EditorDefinition<ChatNode>[] {
    return ChatNodeBase.getEditors();
  }

  getBody() {
    return ChatNodeBase.getBody(this.data);
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    return ChatNodeBase.process(this.data, this.chartNode, inputs, context);
  }
}

export const chatNode = nodeDefinition(ChatNodeImpl, 'Chat');
