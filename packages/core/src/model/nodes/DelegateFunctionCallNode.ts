import { nanoid } from 'nanoid';
import type {
  AssistantChatMessageFunctionCall,
  DataValue,
  GptFunction,
  ParsedAssistantChatMessageFunctionCall,
} from '../DataValue.js';
import type { ChartNode, NodeId, NodeInputDefinition, NodeOutputDefinition, PortId } from '../NodeBase.js';
import type { GraphId } from '../NodeGraph.js';
import { NodeImpl, type NodeBody, type NodeUIData } from '../NodeImpl.js';
import { dedent } from 'ts-dedent';
import type { EditorDefinition } from '../EditorDefinition.js';
import type { RivetUIContext } from '../RivetUIContext.js';
import { nodeDefinition } from '../NodeDefinition.js';
import type { InternalProcessContext } from '../ProcessContext.js';
import type { Inputs, Outputs } from '../GraphProcessor.js';
import { coerceType, coerceTypeOptional } from '../../utils/coerceType.js';

export type DelegateFunctionCallNode = ChartNode<'delegateFunctionCall', DelegateFunctionCallNodeData>;

export type DelegateFunctionCallNodeData = {
  handlers: { key: string; value: GraphId }[];
  unknownHandler: GraphId | undefined;
};

export class DelegateFunctionCallNodeImpl extends NodeImpl<DelegateFunctionCallNode> {
  static create(): DelegateFunctionCallNode {
    const chartNode: DelegateFunctionCallNode = {
      type: 'delegateFunctionCall',
      title: 'Delegate Function Call',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 325,
      },
      data: {
        handlers: [],
        unknownHandler: undefined,
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    const inputs: NodeInputDefinition[] = [];

    inputs.push({
      id: 'function-call' as PortId,
      dataType: 'object',
      title: 'Function Call',
      coerced: true,
      required: true,
      description: 'The function call to delegate to a subgraph.',
    });

    return inputs;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    const outputs: NodeOutputDefinition[] = [];

    outputs.push({
      id: 'output' as PortId,
      dataType: 'string',
      title: 'Output',
      description: 'The output of the function call.',
    });

    outputs.push({
      id: 'message' as PortId,
      dataType: 'object',
      title: 'Message Output',
      description: 'Maps the output for use directly with an Assemble Prompt node and GPT.',
    });

    return outputs;
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Handles a function call by delegating it to a different subgraph depending on the function call.
      `,
      infoBoxTitle: 'Delegate Function Call Node',
      contextMenuTitle: 'Delegate Function Call',
      group: ['Advanced'],
    };
  }

  getEditors(): EditorDefinition<DelegateFunctionCallNode>[] {
    return [
      {
        type: 'custom',
        customEditorId: 'ToolCallHandlers',
        label: 'Handlers',
        dataKey: 'handlers',
      },
      {
        type: 'graphSelector',
        dataKey: 'unknownHandler',
        label: 'Unknown Handler',
        helperMessage: 'The subgraph to delegate to if the function call does not match any handlers.',
      },
    ];
  }

  getBody(context: RivetUIContext): NodeBody {
    if (this.data.handlers.length === 0) {
      return 'No handlers defined';
    }

    const lines = ['Handlers:'];

    this.data.handlers.forEach(({ key, value }) => {
      const subgraphName = context.project.graphs[value]?.metadata!.name! ?? 'Unknown Subgraph';
      lines.push(`    ${key || '(MISSING!)'} -> ${subgraphName}`);
    });

    return lines.join('\n');
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const functionCall = coerceType(
      inputs['function-call' as PortId],
      'object',
    ) as ParsedAssistantChatMessageFunctionCall;

    let handler = this.data.handlers.find((handler) => handler.key === functionCall.name);

    if (!handler) {
      if (this.data.unknownHandler) {
        handler = { key: undefined!, value: this.data.unknownHandler };
      } else {
        throw new Error(`No handler found for function call: ${functionCall.name}`);
      }
    }

    const subgraphInputs: Record<string, DataValue> = {
      _function_name: {
        type: 'string',
        value: functionCall.name,
      },
      _arguments: {
        type: 'object',
        value: functionCall.arguments,
      },
    };

    for (const [argName, argument] of Object.entries(functionCall.arguments)) {
      subgraphInputs[argName] = {
        type: 'any',
        value: argument,
      };
    }

    const handlerGraphId = handler.value;
    const subprocessor = context.createSubProcessor(handlerGraphId, { signal: context.signal });

    const outputs = await subprocessor.processGraph(context, subgraphInputs, context.contextValues);

    const outputString = coerceTypeOptional(outputs.output, 'string') ?? '';

    return {
      ['output' as PortId]: {
        type: 'string',
        value: outputString,
      },
      ['message' as PortId]: {
        type: 'chat-message',
        value: {
          type: 'function',
          message: outputString,
          name: functionCall.id ?? '',
        },
      },
    };
  }
}

export const delegateFunctionCallNode = nodeDefinition(DelegateFunctionCallNodeImpl, 'Delegate Function Call');
