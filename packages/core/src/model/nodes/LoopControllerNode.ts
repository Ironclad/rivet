import { ChartNode, NodeConnection, NodeId, NodeInputDefinition, NodeOutputDefinition, PortId } from '../NodeBase.js';
import { nanoid } from 'nanoid';
import { NodeImpl, NodeUIData, nodeDefinition } from '../NodeImpl.js';
import { Inputs, Outputs } from '../GraphProcessor.js';
import { coerceType } from '../../utils/coerceType.js';
import { InternalProcessContext } from '../ProcessContext.js';
import { dedent } from 'ts-dedent';
import { EditorDefinition } from '../../index.js';

export type LoopControllerNode = ChartNode<'loopController', LoopControllerNodeData>;

export type LoopControllerNodeData = {
  maxIterations?: number;
};

export class LoopControllerNodeImpl extends NodeImpl<LoopControllerNode> {
  static create(): LoopControllerNode {
    const chartNode: LoopControllerNode = {
      type: 'loopController',
      title: 'Loop Controller',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 250,
      },
      data: {
        maxIterations: 100,
      },
    };

    return chartNode;
  }

  getInputDefinitions(connections: NodeConnection[], nodes: Record<NodeId, ChartNode>): NodeInputDefinition[] {
    const inputs: NodeInputDefinition[] = [];
    const messageCount = this.#getInputPortCount(connections);

    inputs.push({
      dataType: 'any',
      id: 'continue' as PortId,
      title: 'Continue',
    });

    let i = 1;
    for (; i <= messageCount + 1; i++) {
      const input: NodeInputDefinition = {
        dataType: 'any',
        id: `input${i}` as PortId,
        title: `Input ${i}`,
      };

      const inputConnection = connections.find(
        (connection) => connection.inputId === input.id && connection.inputNodeId === this.id,
      );
      if (inputConnection && nodes[inputConnection.outputNodeId]) {
        input.title = nodes[inputConnection.outputNodeId]!.title;
      }

      const inputDefault: NodeInputDefinition = {
        dataType: 'any',
        id: `input${i}Default` as PortId,
        title: `Input ${i} Default`,
      };
      const inputDefaultConnection = connections.find(
        (connection) => connection.inputId === inputDefault.id && connection.inputNodeId === this.id,
      );
      if (inputDefaultConnection && nodes[inputDefaultConnection.outputNodeId]) {
        inputDefault.title = nodes[inputDefaultConnection.outputNodeId]!.title;
      }

      inputs.push(input);
      inputs.push(inputDefault);
    }

    return inputs;
  }

  getOutputDefinitions(connections: NodeConnection[], nodes: Record<NodeId, ChartNode>): NodeOutputDefinition[] {
    const messageCount = this.#getInputPortCount(connections);

    const outputs: NodeOutputDefinition[] = [];

    outputs.push({
      dataType: 'any',
      id: 'break' as PortId,
      title: 'Break',
    });

    for (let i = 1; i <= messageCount; i++) {
      const output: NodeOutputDefinition = {
        dataType: 'any',
        id: `output${i}` as PortId,
        title: `Output ${i}`,
      };

      const inputConnection = connections.find(
        (connection) => connection.inputId === `input${i}` && connection.inputNodeId === this.id,
      );
      if (inputConnection && nodes[inputConnection.outputNodeId]) {
        output.title = `${nodes[inputConnection.outputNodeId]!.title}?`;
      }

      outputs.push(output);
    }

    return outputs;
  }

  getEditors(): EditorDefinition<LoopControllerNode>[] {
    return [
      {
        type: 'number',
        label: 'Max Iterations',
        dataKey: 'maxIterations',
      },
    ];
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Defines the entry point for a loop. Values from inside the loop should be passed back through the "Input" ports, and their corresponding "Default" values can be specified on the input ports as well.

        If the "continue" input is falsey, then the "break" output will run.
      `,
      infoBoxTitle: 'Loop Controller Node',
      contextMenuTitle: 'Loop Controller',
      group: ['Logic'],
    };
  }

  #getInputPortCount(connections: NodeConnection[]): number {
    const inputNodeId = this.chartNode.id;
    const messageConnections = connections.filter(
      (connection) => connection.inputNodeId === inputNodeId && connection.inputId.startsWith('input'),
    );

    let maxMessageNumber = 0;
    for (const connection of messageConnections) {
      const messageNumber = parseInt(connection.inputId.replace('input', ''));
      if (messageNumber > maxMessageNumber) {
        maxMessageNumber = messageNumber;
      }
    }

    return maxMessageNumber;
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const output: Outputs = {};

    // If the continue port is not connected (so undefined), or if it's undefined before it's
    // inside the loop itself (connection has not ran yet), then we should continue by default.
    let continueValue = false;

    if (inputs['continue' as PortId] === undefined) {
      continueValue = true;
    } else {
      const continueDataValue = inputs['continue' as PortId]!;
      if (continueDataValue.type === 'control-flow-excluded') {
        continueValue = false;
      } else {
        continueValue = coerceType(continueDataValue, 'boolean');
      }
    }

    const inputCount = Object.keys(inputs).filter((key) => key.startsWith('input') && !key.endsWith('Default')).length;

    if (continueValue) {
      output['break' as PortId] = { type: 'control-flow-excluded', value: 'loop-not-broken' };
    } else {
      const inputValues: unknown[] = [];
      for (let i = 1; i <= inputCount; i++) {
        inputValues.push(inputs[`input${i}` as PortId]?.value);
      }

      // Break gets an array of all the input values
      output['break' as PortId] = { type: 'any[]', value: inputValues };
    }

    for (let i = 1; i <= inputCount; i++) {
      if (continueValue) {
        const inputId = `input${i}` as PortId;
        const outputId = `output${i}` as PortId;

        if (inputs[inputId]) {
          output[outputId] = inputs[inputId]!;
        } else {
          output[outputId] = inputs[`${inputId}Default` as PortId]!;
        }
      } else {
        output[`output${i}` as PortId] = { type: 'control-flow-excluded', value: undefined };
      }
    }

    return output;
  }
}

export const loopControllerNode = nodeDefinition(LoopControllerNodeImpl, 'Loop Controller');
