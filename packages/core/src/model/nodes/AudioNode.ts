import {
  type ChartNode,
  type NodeId,
  type PortId,
  type NodeInputDefinition,
  type NodeOutputDefinition,
} from '../NodeBase.js';
import { NodeImpl, type NodeUIData } from '../NodeImpl.js';
import { nanoid } from 'nanoid/non-secure';
import {
  type DataRef,
  type EditorDefinition,
  type Inputs,
  type InternalProcessContext,
  type Outputs,
} from '../../index.js';
import { base64ToUint8Array, expectType } from '../../utils/index.js';
import { nodeDefinition } from '../NodeDefinition.js';

export type AudioNode = ChartNode<'audio', AudioNodeData>;

type AudioNodeData = {
  data?: DataRef;
  useDataInput: boolean;
};

export class AudioNodeImpl extends NodeImpl<AudioNode> {
  static create(): AudioNode {
    return {
      id: nanoid() as NodeId,
      type: 'audio',
      title: 'Audio',
      visualData: { x: 0, y: 0, width: 300 },
      data: {
        useDataInput: false,
      },
    };
  }

  getInputDefinitions(): NodeInputDefinition[] {
    const inputDefinitions: NodeInputDefinition[] = [];

    if (this.chartNode.data.useDataInput) {
      inputDefinitions.push({
        id: 'data' as PortId,
        title: 'Data',
        dataType: 'string',
        coerced: false,
      });
    }

    return inputDefinitions;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'data' as PortId,
        title: 'Audio Data',
        dataType: 'audio',
      },
    ];
  }

  getEditors(): EditorDefinition<AudioNode>[] {
    return [
      {
        type: 'fileBrowser',
        label: 'Audio File',
        dataKey: 'data',
        useInputToggleDataKey: 'useDataInput',
        accept: 'audio/*',
      },
    ];
  }

  static getUIData(): NodeUIData {
    return {
      contextMenuTitle: 'Audio',
      group: 'Data',
      infoBoxTitle: 'Audio Node',
      infoBoxBody: 'Defines an audio sample for use with other nodes. Can convert a binary type into an audio type.',
    };
  }

  async process(inputData: Inputs, context: InternalProcessContext): Promise<Outputs> {
    let data: Uint8Array;

    if (this.chartNode.data.useDataInput) {
      data = expectType(inputData['data' as PortId], 'binary');
    } else {
      const dataRef = this.data.data?.refId;
      if (!dataRef) {
        throw new Error('No data ref');
      }

      const encodedData = context.project.data?.[dataRef] as string;

      if (!encodedData) {
        throw new Error(`No data at ref ${dataRef}`);
      }

      data = base64ToUint8Array(encodedData);
    }

    return {
      ['data' as PortId]: {
        type: 'audio',
        value: { data },
      },
    };
  }
}

export const audioNode = nodeDefinition(AudioNodeImpl, 'Audio');
