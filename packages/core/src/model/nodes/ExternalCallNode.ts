import {
  type ChartNode,
  type NodeId,
  type NodeInputDefinition,
  type PortId,
  type NodeOutputDefinition,
} from '../NodeBase.js';
import { NodeImpl, type NodeUIData } from '../NodeImpl.js';
import { nodeDefinition } from '../NodeDefinition.js';
import { type AnyDataValue, type ArrayDataValue } from '../DataValue.js';
import { nanoid } from 'nanoid/non-secure';
import { type Inputs, type Outputs } from '../GraphProcessor.js';
import { coerceType } from '../../utils/coerceType.js';
import { getError } from '../../utils/errors.js';
import { type InternalProcessContext } from '../ProcessContext.js';
import { omit } from 'lodash-es';
import { dedent } from 'ts-dedent';
import { type EditorDefinition } from '../EditorDefinition.js';
import { type NodeBodySpec } from '../NodeBodySpec.js';

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

  getBody(): string | NodeBodySpec | undefined {
    return this.data.useFunctionNameInput ? '(Using Input)' : this.data.functionName;
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Provides a way to call into the host project from inside a Rivet graph when Rivet graphs are integrated into another project.
      `,
      infoBoxTitle: 'External Call Node',
      contextMenuTitle: 'External Call',
      group: ['Advanced'],
    };
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const functionName = this.chartNode.data.useFunctionNameInput
      ? coerceType(inputs['functionName' as PortId], 'string')
      : this.chartNode.data.functionName;

    const args = inputs['arguments' as PortId];
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
    const externalContext = omit(context, ['setGlobal']);

    if (!fn) {
      if (this.data.useErrorOutput) {
        return {
          ['result' as PortId]: {
            type: 'control-flow-excluded',
            value: undefined,
          },
          ['error' as PortId]: {
            type: 'string',
            value: `Function ${functionName} not was not defined using setExternalCall`,
          },
        };
      } else {
        throw new Error(`Function ${functionName} not was not defined using setExternalCall`);
      }
    }

    if (this.data.useErrorOutput) {
      try {
        const result = await fn(externalContext, ...arrayArgs.value);
        return {
          ['result' as PortId]: result,
          ['cost' as PortId]: {
            type: 'number',
            value: result.cost ?? 0,
          },
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
    const result = await fn(externalContext, ...arrayArgs.value);
    return {
      ['result' as PortId]: result,
    };
  }
}

export const externalCallNode = nodeDefinition(ExternalCallNodeImpl, 'External Call');
