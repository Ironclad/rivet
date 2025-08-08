import { nanoid } from 'nanoid';
import type { DataValue, ParsedAssistantChatMessageFunctionCall } from '../DataValue.js';
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
import { getError } from '../../utils/errors.js';
import { omit } from 'lodash-es';

export type DelegateFunctionCallNode = ChartNode<'delegateFunctionCall', DelegateFunctionCallNodeData>;

export type DelegateFunctionCallNodeData = {
  handlers: { key: string; value: GraphId }[];
  unknownHandler: GraphId | undefined;
  autoDelegate: boolean;
  fallBackToExternalCall?: boolean;
  passthroughErrors?: boolean;
};

export class DelegateFunctionCallNodeImpl extends NodeImpl<DelegateFunctionCallNode> {
  static create(): DelegateFunctionCallNode {
    const chartNode: DelegateFunctionCallNode = {
      type: 'delegateFunctionCall',
      title: 'Delegate Tool Call',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 325,
      },
      data: {
        handlers: [],
        unknownHandler: undefined,
        autoDelegate: true,
        fallBackToExternalCall: true,
        passthroughErrors: true,
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    const inputs: NodeInputDefinition[] = [];

    inputs.push({
      id: 'function-call' as PortId,
      dataType: 'object',
      title: 'Tool Call',
      coerced: true,
      required: true,
      description: 'The tool call to delegate to a subgraph.',
    });

    return inputs;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    const outputs: NodeOutputDefinition[] = [];

    outputs.push({
      id: 'output' as PortId,
      dataType: 'string',
      title: 'Output',
      description: 'The output of the tool call.',
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
        Handles a tool call by delegating it to a different subgraph depending on the tool call.
      `,
      infoBoxTitle: 'Delegate Tool Call Node',
      contextMenuTitle: 'Delegate Tool Call',
      group: ['Advanced'],
    };
  }

  getEditors(): EditorDefinition<DelegateFunctionCallNode>[] {
    return [
      {
        type: 'toggle',
        label: 'Auto Delegate',
        dataKey: 'autoDelegate',
        helperMessage: 'Automatically delegates tool calls to the subgraph containing the same name as the tool.',
      },
      {
        type: 'toggle',
        label: 'Fall Back To External Call',
        dataKey: 'fallBackToExternalCall',
        helperMessage:
          'If no matching subgraph is found, try calling external functions before falling back to the unknown handler.',
        hideIf: (data) => !data.autoDelegate,
      },
      {
        type: 'toggle',
        label: 'Passthrough Errors',
        dataKey: 'passthroughErrors',
        helperMessage: 'Return external function errors as string outputs instead of aborting the node.',
        hideIf: (data) => !data.autoDelegate || !data.fallBackToExternalCall,
      },
      {
        type: 'custom',
        customEditorId: 'ToolCallHandlers',
        label: 'Handlers',
        dataKey: 'handlers',
        hideIf: (data) => data.autoDelegate,
      },
      {
        type: 'graphSelector',
        dataKey: 'unknownHandler',
        label: 'Unknown Handler',
        helperMessage: 'The subgraph to delegate to if the tool call does not match any handlers.',
      },
    ];
  }

  getBody(context: RivetUIContext): NodeBody {
    if (this.data.autoDelegate) {
      let body = 'Auto Delegate To Subgraphs';
      if (this.data.fallBackToExternalCall) {
        body += '\n(+ External Call Fallback';
        if (this.data.passthroughErrors) {
          body += ', Passthrough Errors';
        }
        body += ')';
      }
      return body;
    }

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

    let handler: { key: string; value: GraphId } | undefined;

    if (this.data.autoDelegate) {
      const matchingGraph = Object.values(context.project.graphs).find((graph) =>
        graph.metadata?.name?.includes(functionCall.name),
      );
      if (matchingGraph) {
        handler = { key: undefined!, value: matchingGraph.metadata!.id! };
      }
    } else {
      handler = this.data.handlers.find((handler) => handler.key === functionCall.name);
    }

    if (!handler) {
      // Try external function call first (if enabled)
      if (this.data.autoDelegate && this.data.fallBackToExternalCall) {
        const externalFunction = context.externalFunctions[functionCall.name];
        if (externalFunction) {
          try {
            const externalContext = omit(context, ['setGlobal']);
            const result = await externalFunction(externalContext, functionCall.arguments ?? {});

            const outputString = typeof result === 'string' ? result : JSON.stringify(result);

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
          } catch (error) {
            if (this.data.passthroughErrors) {
              // Return error as string output instead of throwing
              const errorMessage = `Error: ${getError(error).message}`;
              return {
                ['output' as PortId]: {
                  type: 'string',
                  value: errorMessage,
                },
                ['message' as PortId]: {
                  type: 'chat-message',
                  value: {
                    type: 'function',
                    message: errorMessage,
                    name: functionCall.id ?? '',
                  },
                },
              };
            } else {
              throw new Error(`External function call failed for ${functionCall.name}: ${getError(error).message}`);
            }
          }
        }
      }

      // Fall back to unknown handler if external function wasn't found/enabled
      if (this.data.unknownHandler) {
        handler = { key: undefined!, value: this.data.unknownHandler };
      } else {
        if (this.data.autoDelegate) {
          const errorMessage = this.data.fallBackToExternalCall
            ? `No handler found for tool call: ${functionCall.name}, no graph containing the name "${functionCall.name}" was found, and no external function with that name was registered.`
            : `No handler found for tool call: ${functionCall.name}, no graph containing the name "${functionCall.name}" was found.`;
          throw new Error(errorMessage);
        } else {
          throw new Error(`No handler found for tool call: ${functionCall.name}`);
        }
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

    for (const [argName, argument] of Object.entries(functionCall.arguments ?? {})) {
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

export const delegateFunctionCallNode = nodeDefinition(DelegateFunctionCallNodeImpl, 'Delegate Tool Call');
