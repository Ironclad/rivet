import type { ChartNode, NodeId, NodeOutputDefinition, PortId, NodeInputDefinition } from '../NodeBase.js';
import { nanoid } from 'nanoid/non-secure';
import { NodeImpl, type NodeUIData } from '../NodeImpl.js';
import type { Inputs, Outputs } from '../GraphProcessor.js';
import type { InternalProcessContext } from '../ProcessContext.js';
import type { EditorDefinition } from '../../index.js';
import { dedent } from 'ts-dedent';
import { nodeDefinition } from '../NodeDefinition.js';
import { coerceTypeOptional } from '../../utils/coerceType.js';

export type AbortGraphNode = ChartNode<'abortGraph', AbortGraphNodeData>;

export type AbortGraphNodeData = {
  /** Did the graph abort, but it's a success? Use this for early-exit instead of "error abort". */
  successfully: boolean;

  useSuccessfullyInput?: boolean;

  errorMessage?: string;
};

export class AbortGraphNodeImpl extends NodeImpl<AbortGraphNode> {
  static create(): AbortGraphNode {
    const chartNode: AbortGraphNode = {
      type: 'abortGraph',
      title: 'Abort Graph',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 200,
      },
      data: {
        successfully: true,
        errorMessage: '',
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    const inputs: NodeInputDefinition[] = [
      {
        id: 'data' as PortId,
        title: 'Data or Error',
        dataType: 'any',
        description: 'The message to abort the graph with.',
      },
    ];

    if (this.data.useSuccessfullyInput) {
      inputs.push({
        id: 'successfully' as PortId,
        title: 'Successfully',
        dataType: 'boolean',
        description: 'Whether to successfully abort the graph (early-exit), or error abort the graph.',
      });
    }

    return inputs;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [];
  }

  getEditors(): EditorDefinition<AbortGraphNode>[] {
    return [
      {
        type: 'toggle',
        label: 'Successfully Abort',
        dataKey: 'successfully',
        useInputToggleDataKey: 'useSuccessfullyInput',
      },
      {
        type: 'string',
        label: 'Error Message (if not successfully aborting)',
        dataKey: 'errorMessage',
      },
    ];
  }

  getBody(): string | undefined {
    return dedent`
      ${
        this.data.useSuccessfullyInput
          ? 'Success depends on input'
          : this.data.successfully
          ? 'Successfully Abort'
          : this.data.errorMessage
          ? `Error Abort: ${this.data.errorMessage}`
          : 'Error Abort'
      }
    `;
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Aborts the execution of the entire graph immediately.

        Can either "successfully" abort the graph (early-exit), or "error" abort the graph.
      `,
      infoBoxTitle: 'Abort Graph Node',
      contextMenuTitle: 'Abort Graph',
      group: ['Logic'],
    };
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const successfully = this.data.useSuccessfullyInput
      ? coerceTypeOptional(inputs['successfully' as PortId], 'boolean') ?? this.data.successfully
      : this.data.successfully;

    if (successfully) {
      context.abortGraph();
    } else {
      const errorMessage =
        coerceTypeOptional(inputs['data' as PortId], 'string')?.trim() ||
        this.data.errorMessage ||
        'Graph aborted with error';
      context.abortGraph(errorMessage);
    }

    return {};
  }
}

export const abortGraphNode = nodeDefinition(AbortGraphNodeImpl, 'Abort Graph');
