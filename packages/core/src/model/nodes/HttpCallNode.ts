import {
  type ChartNode,
  type NodeId,
  type NodeInputDefinition,
  type NodeOutputDefinition,
  type PortId,
} from '../NodeBase.js';
import { nanoid } from 'nanoid/non-secure';
import { NodeImpl, type NodeUIData } from '../NodeImpl.js';
import { nodeDefinition } from '../NodeDefinition.js';
import { type Inputs, type Outputs } from '../GraphProcessor.js';
import { type EditorDefinition, type InternalProcessContext } from '../../index.js';
import { coerceType, dedent, getInputOrData } from '../../utils/index.js';
import { getError } from '../../utils/errors.js';

export type HttpCallNode = ChartNode<'httpCall', HttpCallNodeData>;

export type HttpCallNodeData = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  useMethodInput?: boolean;

  url: string;
  useUrlInput?: boolean;

  headers: string;
  useHeadersInput?: boolean;

  body: string;
  useBodyInput?: boolean;

  errorOnNon200?: boolean;
};

export class HttpCallNodeImpl extends NodeImpl<HttpCallNode> {
  static create(): HttpCallNode {
    const chartNode: HttpCallNode = {
      type: 'httpCall',
      title: 'Http Call',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 250,
      },
      data: {
        method: 'GET',
        url: '',
        headers: '',
        body: '',
        errorOnNon200: true,
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    const inputs: NodeInputDefinition[] = [];

    if (this.data.useMethodInput) {
      inputs.push({
        dataType: 'string',
        id: 'method' as PortId,
        title: 'Method',
      });
    }

    if (this.data.useUrlInput) {
      inputs.push({
        dataType: 'string',
        id: 'url' as PortId,
        title: 'URL',
      });
    }

    if (this.data.useHeadersInput) {
      inputs.push({
        dataType: 'object',
        id: 'headers' as PortId,
        title: 'Headers',
      });
    }

    if (this.data.useBodyInput) {
      inputs.push({
        dataType: 'string',
        id: 'req_body' as PortId,
        title: 'Body',
      });
    }

    return inputs;
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        dataType: 'string',
        id: 'res_body' as PortId,
        title: 'Body',
      },
      {
        dataType: 'object',
        id: 'json' as PortId,
        title: 'JSON',
      },
      {
        dataType: 'number',
        id: 'statusCode' as PortId,
        title: 'Status Code',
      },
      {
        dataType: 'object',
        id: 'res_headers' as PortId,
        title: 'Headers',
      },
    ];
  }

  getEditors(): EditorDefinition<HttpCallNode>[] {
    return [
      {
        type: 'dropdown',
        label: 'Method',
        dataKey: 'method',
        useInputToggleDataKey: 'useMethodInput',
        options: [
          { label: 'GET', value: 'GET' },
          { label: 'POST', value: 'POST' },
          { label: 'PUT', value: 'PUT' },
          { label: 'DELETE', value: 'DELETE' },
        ],
      },
      {
        type: 'string',
        label: 'URL',
        dataKey: 'url',
        useInputToggleDataKey: 'useUrlInput',
      },
      {
        type: 'code',
        label: 'Headers',
        dataKey: 'headers',
        useInputToggleDataKey: 'useHeadersInput',
        language: 'json',
      },
      {
        type: 'code',
        label: 'Body',
        dataKey: 'body',
        useInputToggleDataKey: 'useBodyInput',
        language: 'json',
      },
      {
        type: 'toggle',
        label: 'Error on non-200 status code',
        dataKey: 'errorOnNon200',
      },
    ];
  }

  getBody(): string {
    return dedent`
      ${this.data.useMethodInput ? '(Method Using Input)' : this.data.method} ${
      this.data.useUrlInput ? '(URL Using Input)' : this.data.url
    } ${
      this.data.useHeadersInput
        ? '\nHeaders: (Using Input)'
        : this.data.headers.trim()
        ? `\nHeaders: ${this.data.headers}`
        : ''
    }${this.data.useBodyInput ? '\nBody: (Using Input)' : this.data.body.trim() ? `\nBody: ${this.data.body}` : ''}${
      this.data.errorOnNon200 ? '\nError on non-200' : ''
    }
    `;
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Makes an HTTP call to the specified URL with the given method, headers, and body.
      `,
      infoBoxTitle: 'HTTP Call Node',
      contextMenuTitle: 'HTTP Call',
      group: ['Advanced'],
    };
  }

  async process(inputs: Inputs, context: InternalProcessContext): Promise<Outputs> {
    const method = getInputOrData(this.data, inputs, 'method', 'string');
    const url = getInputOrData(this.data, inputs, 'url', 'string');

    let headers: Record<string, string> | undefined;
    if (this.data.useHeadersInput) {
      const headersInput = inputs['headers' as PortId];
      if (headersInput?.type === 'string') {
        headers = JSON.parse(headersInput!.value);
      } else if (headersInput?.type === 'object') {
        headers = headersInput!.value as Record<string, string>;
      } else {
        headers = coerceType(headersInput, 'object') as Record<string, string>;
      }
    } else if (this.data.headers.trim()) {
      headers = JSON.parse(this.data.headers);
    }

    let body: string | undefined;
    if (this.data.useBodyInput) {
      const bodyInput = inputs['req_body' as PortId];
      if (bodyInput?.type === 'string') {
        body = bodyInput!.value;
      } else if (bodyInput?.type === 'object') {
        body = JSON.stringify(bodyInput!.value);
      } else {
        body = coerceType(bodyInput, 'string');
      }
    } else {
      body = this.data.body || undefined;
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body,
        signal: context.signal,
        mode: 'cors',
      });

      const output: Outputs = {
        ['statusCode' as PortId]: {
          type: 'number',
          value: response.status,
        },
        ['res_headers' as PortId]: {
          type: 'object',
          value: Object.fromEntries(response.headers.entries()),
        },
      };

      const responseBody = await response.text();

      output['res_body' as PortId] = {
        type: 'string',
        value: responseBody,
      };

      if (response.headers.get('content-type')?.includes('application/json')) {
        const jsonData = JSON.parse(responseBody);
        output['json' as PortId] = {
          type: 'object',
          value: jsonData,
        };
      } else {
        output['json' as PortId] = {
          type: 'control-flow-excluded',
          value: undefined,
        };
      }

      return output;
    } catch (err) {
      const { message } = getError(err);
      if (message.includes('Load failed') || message.includes('Failed to fetch')) {
        if (context.executor === 'browser') {
          throw new Error(
            'Failed to make HTTP call. You may be running into CORS problems. Try using the Node executor in the top-right menu.',
          );
        }
      }

      throw err;
    }
  }
}

export const httpCallNode = nodeDefinition(HttpCallNodeImpl, 'Http Call');
