import {
  type ChartNode,
  type NodeId,
  type PortId,
  type NodeInputDefinition,
  type NodeOutputDefinition,
} from '../NodeBase.js';
import { NodeImpl, type NodeUIData } from '../NodeImpl.js';
import { nodeDefinition } from '../NodeDefinition.js';
import { nanoid } from 'nanoid/non-secure';
import {
  type DataRef,
  type EditorDefinition,
  type Inputs,
  type InternalProcessContext,
  type Outputs,
} from '../../index.js';
import { base64ToUint8Array } from '../../utils/base64.js';
import { expectType } from '../../utils/expectType.js';

export type ImageNode = ChartNode<'image', ImageNodeData>;

type ImageNodeData = {
  data?: DataRef;
  useDataInput: boolean;
  mediaType: 'image/png' | 'image/jpeg' | 'image/gif';
  useMediaTypeInput: boolean;
};

export class ImageNodeImpl extends NodeImpl<ImageNode> {
  static create(): ImageNode {
    return {
      id: nanoid() as NodeId,
      type: 'image',
      title: 'Image',
      visualData: { x: 0, y: 0, width: 250 },
      data: {
        useDataInput: false,
        mediaType: 'image/png',
        useMediaTypeInput: false,
      },
    };
  }

  getInputDefinitions(): NodeInputDefinition[] {
    const inputDefinitions: NodeInputDefinition[] = [];

    if (this.chartNode.data.useDataInput) {
      inputDefinitions.push({
        id: 'data' as PortId,
        title: 'Data',
        dataType: 'binary',
        coerced: false,
      });
    }

    if (this.chartNode.data.useMediaTypeInput) {
      inputDefinitions.push({
        id: 'mediaType' as PortId,
        title: 'Media Type',
        dataType: 'string',
      });
    }

    return inputDefinitions;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'image' as PortId,
        title: 'Image',
        dataType: 'image',
      },
    ];
  }

  getEditors(): EditorDefinition<ImageNode>[] {
    return [
      {
        type: 'dropdown',
        label: 'Media Type',
        dataKey: 'mediaType',
        options: [
          { value: 'image/png', label: 'PNG' },
          { value: 'image/jpeg', label: 'JPEG' },
          { value: 'image/gif', label: 'GIF' },
        ],
        useInputToggleDataKey: 'useMediaTypeInput',
      },
      {
        type: 'imageBrowser',
        label: 'Image',
        dataKey: 'data',
        useInputToggleDataKey: 'useDataInput',
        mediaTypeDataKey: 'mediaType',
      },
    ];
  }

  static getUIData(): NodeUIData {
    return {
      contextMenuTitle: 'Image',
      group: 'Data',
      infoBoxTitle: 'Image Node',
      infoBoxBody: 'Defines a static image for use with other nodes. Can convert a binary type into an image type.',
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

    const mediaType = this.chartNode.data.useMediaTypeInput
      ? expectType(inputData['mediaType' as PortId], 'string')
      : this.chartNode.data.mediaType;

    return {
      ['image' as PortId]: {
        type: 'image',
        value: { mediaType: mediaType as 'image/png' | 'image/jpeg' | 'image/gif', data },
      },
    };
  }
}

export const imageNode = nodeDefinition(ImageNodeImpl, 'Image');
