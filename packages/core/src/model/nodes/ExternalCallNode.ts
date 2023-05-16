import { ChartNode, NodeId, NodeInputDefinition, PortId, NodeOutputDefinition } from '../NodeBase';
import { InternalProcessContext, NodeImpl } from '../NodeImpl';
import { AnyDataValue, ArrayDataValue, DataValue } from '../DataValue';
import { nanoid } from 'nanoid';
import { Inputs } from '../GraphProcessor';
import { coerceType } from '../../utils/coerceType';

export type ExternalCallNode = ChartNode<'externalCall', ExternalCallNodeData>;

export type ExternalCallNodeData = {
  functionName: string;
  useFunctionNameInput: boolean;
};

export class ExternalCallNodeImpl extends NodeImpl<ExternalCallNode> {
  static create(): ExternalCallNode {
    return {
      id: nanoid() as NodeId,
      type: 'externalCall',
      title: 'External Call',
      visualData: { x: 0, y: 0, width: 150 },
      data: {
        functionName: '',
        useFunctionNameInput: false,
      },
    };
  }

  getInputDefinitions(): NodeInputDefinition[] {
    const inputDefinitions: NodeInputDefinition[] = [];

    if (this.chartNode.data.useFunctionNameInput) {
      inputDefinitions.push({
        id: 'functionName' as PortId,
        title: 'Function Name',
        dataType: 'string',
      });
    }

    inputDefinitions.push({
      id: 'arguments' as PortId,
      title: 'Arguments',
      dataType: 'any[]',
    });

    return inputDefinitions;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'result' as PortId,
        title: 'Result',
        dataType: 'any',
      },
    ];
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Record<string, DataValue>> {
    const functionName = this.chartNode.data.useFunctionNameInput
      ? coerceType(inputs['functionName' as PortId], 'string')
      : this.chartNode.data.functionName;

    let args = inputs['arguments' as PortId];

    if (args?.type.endsWith('[]') === false) {
      args = {
        type: 'any[]',
        value: [args.value],
      };
    }

    const fn = context.externalFunctions[functionName];

    if (!fn) {
      throw new Error(`Function ${functionName} not was not defined using setExternalCall`);
    }

    const result = await fn(...(args as ArrayDataValue<AnyDataValue>).value);
    return {
      result: {
        type: 'any',
        value: result,
      },
    };
  }
}
