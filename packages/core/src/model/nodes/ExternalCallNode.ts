import { ChartNode, NodeId, NodeInputDefinition, PortId, NodeOutputDefinition } from '../NodeBase';
import { EditorDefinition, NodeImpl, nodeDefinition } from '../NodeImpl';
import { AnyDataValue, ArrayDataValue } from '../DataValue';
import { nanoid } from 'nanoid';
import { Inputs, Outputs } from '../GraphProcessor';
import { coerceType } from '../../utils/coerceType';
import { getError } from '../../utils/errors';
import { InternalProcessContext } from '../ProcessContext';

export type ExternalCallNode = ChartNode<'externalCall', ExternalCallNodeData>;

export type ExternalCallNodeData = {
  functionName: string;
  useFunctionNameInput: boolean;
  useErrorOutput: boolean;
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
        useErrorOutput: false,
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
    const outputs: NodeOutputDefinition[] = [
      {
        id: 'result' as PortId,
        title: 'Result',
        dataType: 'any',
      },
    ];

    if (this.chartNode.data.useErrorOutput) {
      outputs.push({
        id: 'error' as PortId,
        title: 'Error',
        dataType: 'string',
      });
    }

    return outputs;
  }

  getEditors(): EditorDefinition<ExternalCallNode>[] {
    return [
      {
        type: 'string',
        label: 'Function Name',
        dataKey: 'functionName',
        useInputToggleDataKey: 'useFunctionNameInput',
      },
      {
        type: 'toggle',
        label: 'Use Error Output',
        dataKey: 'useErrorOutput',
      },
    ];
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const functionName = this.chartNode.data.useFunctionNameInput
      ? coerceType(inputs['functionName' as PortId], 'string')
      : this.chartNode.data.functionName;

    let args = inputs['arguments' as PortId];
    let arrayArgs: ArrayDataValue<AnyDataValue> = {
      type: 'any[]',
      value: [],
    };

    if (args) {
      if (args.type.endsWith('[]') === false) {
        arrayArgs = {
          type: 'any[]',
          value: [args.value],
        };
      } else {
        arrayArgs = args as ArrayDataValue<AnyDataValue>;
      }
    }

    const fn = context.externalFunctions[functionName];

    if (!fn) {
      throw new Error(`Function ${functionName} not was not defined using setExternalCall`);
    }

    if (this.data.useErrorOutput) {
      try {
        const result = await fn(...arrayArgs.value);
        return {
          ['result' as PortId]: result,
          ['error' as PortId]: {
            type: 'control-flow-excluded',
            value: undefined,
          },
        };
      } catch (error) {
        return {
          ['result' as PortId]: {
            type: 'control-flow-excluded',
            value: undefined,
          },
          ['error' as PortId]: {
            type: 'string',
            value: getError(error).message,
          },
        };
      }
    }
    const result = await fn(...arrayArgs.value);
    return {
      ['result' as PortId]: result,
    };
  }
}

export const externalCallNode = nodeDefinition(ExternalCallNodeImpl, 'External Call');
