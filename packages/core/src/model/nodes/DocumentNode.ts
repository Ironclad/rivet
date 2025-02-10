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
  type NodeBody,
  type Outputs,
  type SupportedDocumentMediaTypes,
} from '../../index.js';
import { base64ToUint8Array, expectType } from '../../utils/index.js';
import { nodeDefinition } from '../NodeDefinition.js';
import { getInputOrData } from '../../utils/inputs.js';
import type { RivetUIContext } from '../RivetUIContext.js';
import { dedent } from '../../utils/misc.js';

export type DocumentNode = ChartNode<'document', DocumentNodeData>;

type DocumentNodeData = {
  data?: DataRef;
  useDataInput: boolean;

  mediaType?: SupportedDocumentMediaTypes;
  useMediaTypeInput: boolean;

  title: string;
  useTitleInput: boolean;

  context: string;
  useContextInput: boolean;

  enableCitations: boolean;
  useEnableCitationsInput: boolean;
};

export class DocumentNodeImpl extends NodeImpl<DocumentNode> {
  static create(): DocumentNode {
    return {
      id: nanoid() as NodeId,
      type: 'document',
      title: 'Document',
      visualData: { x: 0, y: 0, width: 300 },
      data: {
        useDataInput: false,
        useMediaTypeInput: false,
        title: '',
        useTitleInput: false,
        context: '',
        useContextInput: false,
        enableCitations: false,
        useEnableCitationsInput: false,
      },
    };
  }

  getInputDefinitions(): NodeInputDefinition[] {
    const inputDefinitions: NodeInputDefinition[] = [];

    if (this.chartNode.data.useDataInput) {
      inputDefinitions.push({
        id: 'data' as PortId,
        title: 'Data',
        dataType: ['string', 'binary'],
        coerced: false,
        description: 'The document data. Either string or binary data loaded from a file.',
      });
    }

    if (this.chartNode.data.useMediaTypeInput) {
      inputDefinitions.push({
        id: 'mediaType' as PortId,
        title: 'Media Type',
        dataType: 'string',
        coerced: false,
        description: 'The media type of the document, such as text/plain or application/pdf.',
      });
    }

    if (this.data.useTitleInput) {
      inputDefinitions.push({
        id: 'title' as PortId,
        title: 'Title',
        dataType: 'string',
        coerced: true,
        description: 'The title of the document.',
      });
    }

    if (this.data.useContextInput) {
      inputDefinitions.push({
        id: 'context' as PortId,
        title: 'Context',
        dataType: 'string',
        coerced: true,
        description: 'The context of the document.',
      });
    }

    if (this.data.useEnableCitationsInput) {
      inputDefinitions.push({
        id: 'enableCitations' as PortId,
        title: 'Enable Citations',
        dataType: 'boolean',
        coerced: true,
        description: 'Whether to enable citations for the document.',
      });
    }

    return inputDefinitions;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'data' as PortId,
        title: 'Document Data',
        dataType: 'document',
      },
    ];
  }

  getEditors(): EditorDefinition<DocumentNode>[] {
    return [
      {
        type: 'fileBrowser',
        label: 'Document File',
        dataKey: 'data',
        mediaTypeDataKey: 'mediaType',
        useInputToggleDataKey: 'useDataInput',
        accept: '*/*',
      },
      {
        type: 'string',
        label: 'Media Type',
        dataKey: 'mediaType',
        useInputToggleDataKey: 'useMediaTypeInput',
      },
      {
        type: 'string',
        label: 'Title',
        dataKey: 'title',
        useInputToggleDataKey: 'useTitleInput',
      },
      {
        type: 'string',
        label: 'Context',
        dataKey: 'context',
        useInputToggleDataKey: 'useContextInput',
      },
      {
        type: 'toggle',
        label: 'Enable Citations',
        dataKey: 'enableCitations',
        useInputToggleDataKey: 'useEnableCitationsInput',
      },
    ];
  }

  static getUIData(): NodeUIData {
    return {
      contextMenuTitle: 'Document',
      group: 'Data',
      infoBoxTitle: 'Document Node',
      infoBoxBody:
        'Defines a document for use with other nodes such as Assemble Message. Can accept text and PDF files.',
    };
  }

  getBody(_context: RivetUIContext): NodeBody | Promise<NodeBody> {
    const parts = [
      this.data.useDataInput ? '(Data from input)' : '(Data stored in node)',
      this.data.useMediaTypeInput
        ? '(Media type from input)'
        : this.data.mediaType
          ? `(${this.data.mediaType.trim()})`
          : undefined,
      this.data.useTitleInput ? '(Title from input)' : this.data.title ? `Title: ${this.data.title}` : undefined,
      this.data.useContextInput
        ? '(Context from input)'
        : this.data.context
          ? `Context: ${this.data.context}`
          : undefined,
    ].filter((x) => x != null);

    return dedent`
      ${parts.join('\n')}
    `;
  }

  async process(inputData: Inputs, context: InternalProcessContext): Promise<Outputs> {
    let data: Uint8Array;

    const mediaType = getInputOrData(this.data, inputData, 'mediaType', 'string') || 'text/plain';

    const title = getInputOrData(this.data, inputData, 'title');
    const contextInput = getInputOrData(this.data, inputData, 'context');
    const enableCitations = getInputOrData(this.data, inputData, 'enableCitations', 'boolean');

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
        type: 'document',
        value: {
          data,
          mediaType: mediaType as SupportedDocumentMediaTypes,
          title,
          context: contextInput,
          enableCitations,
        },
      },
    };
  }
}

export const documentNode = nodeDefinition(DocumentNodeImpl, 'Document');
