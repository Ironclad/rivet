import { ChartNode, NodeId, PortId } from '../NodeBase.js';
import { NodeInputDefinition, NodeOutputDefinition } from '../NodeBase.js';
import { NodeImpl, NodeUIData, nodeDefinition } from '../NodeImpl.js';
import { nanoid } from 'nanoid';
import { EditorDefinition, Inputs, Outputs, base64ToUint8Array, expectType } from '../../index.js';

export type ImageNode = ChartNode<'image', ImageNodeData>;

type ImageNodeData = {
  data: string;
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
        data: '',
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
        dataType: 'string',
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

  async process(inputData: Inputs): Promise<Outputs> {
    let data: Uint8Array;

    if (this.chartNode.data.useDataInput) {
      data = expectType(inputData['data' as PortId], 'binary');
    } else {
      const encodedData = this.data.data;
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
