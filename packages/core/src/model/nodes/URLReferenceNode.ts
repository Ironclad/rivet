import {
  type ChartNode,
  type NodeId,
  type NodeInputDefinition,
  type NodeOutputDefinition,
  type PortId,
} from '../NodeBase.js';
import { nanoid } from 'nanoid/non-secure';
import { NodeImpl } from '../NodeImpl.js';
import { type Inputs, type Outputs } from '../GraphProcessor.js';
import { type EditorDefinition, type NodeUIData } from '../../index.js';
import { nodeDefinition } from '../../model/NodeDefinition.js';
import { getInputOrData } from '../../utils/index.js';

export type UrlReferenceNode = ChartNode<'urlReference', UrlReferenceNodeData>;

export type UrlReferenceNodeData = {
  url: string;
  useUrlInput?: boolean;
};

export class UrlReferenceNodeImpl extends NodeImpl<UrlReferenceNode> {
  static create(): UrlReferenceNode {
    const chartNode: UrlReferenceNode = {
      type: 'urlReference',
      title: 'URL Reference',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 225,
      },
      data: {
        url: '',
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    const inputs: NodeInputDefinition[] = [];

    if (this.data.useUrlInput) {
      inputs.push({
        dataType: 'string',
        id: 'url' as PortId,
        title: 'URL',
        description: 'The value to convert into a URL reference.',
        coerced: true,
      });
    }

    return inputs;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        dataType: 'object',
        id: 'urlReference' as PortId,
        title: 'URL Reference',
        description: 'A reference to a URL.',
      },
    ];
  }

  getEditors(): EditorDefinition<UrlReferenceNode>[] {
    return [
      {
        type: 'string',
        label: 'URL',
        dataKey: 'url',
        useInputToggleDataKey: 'useUrlInput',
      },
    ];
  }

  static getUIData(): NodeUIData {
    return {
      contextMenuTitle: 'URL Reference',
      group: 'Data',
      infoBoxTitle: 'URL Reference Node',
      infoBoxBody:
        'Defines a reference to a URL, or converts a string into a URL reference. Used with the Assemble Message node to define URLs for attachments/images.',
    };
  }

  getBody(): string {
    return this.data.useUrlInput ? '(URL Using Input)' : this.data.url;
  }

  async process(inputs: Inputs): Promise<Outputs> {
    const url = getInputOrData(this.data, inputs, 'url', 'string');

    return {
      ['urlReference' as PortId]: {
        type: 'object',
        value: { type: 'url_reference', url },
      },
    };
  }
}

export const urlReferenceNode = nodeDefinition(UrlReferenceNodeImpl, 'URL Reference');
