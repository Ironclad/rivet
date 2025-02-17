import {
  type ChartNode,
  type NodeId,
  type NodeInputDefinition,
  type PortId,
  type NodeOutputDefinition,
} from '../NodeBase.js';
import { nanoid } from 'nanoid/non-secure';
import { NodeImpl, type NodeUIData } from '../NodeImpl.js';
import { nodeDefinition } from '../NodeDefinition.js';
import { type DataValue } from '../DataValue.js';
import { type EditorDefinition } from '../EditorDefinition.js';
import { dedent } from 'ts-dedent';
import { coerceTypeOptional } from '../../utils/coerceType.js';
import { extractInterpolationVariables, interpolate } from '../../utils/interpolation.js';
import { get, sortBy } from 'lodash-es';

export type ToTreeNode = ChartNode<'toTree', ToTreeNodeData>;

export type ToTreeNodeData = {
  format: string;
  childrenProperty: string;
  useSortAlphabetically: boolean;
};

export class ToTreeNodeImpl extends NodeImpl<ToTreeNode> {
  static create(): ToTreeNode {
    const chartNode: ToTreeNode = {
      type: 'toTree',
      title: 'To Tree',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 300,
      },
      data: {
        format: '{{path}}',
        childrenProperty: 'children',
        useSortAlphabetically: true,
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    return [
      {
        id: 'objects' as PortId,
        title: 'Objects',
        dataType: ['object[]', 'object'],
        required: true,
      },
    ];
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        id: 'tree' as PortId,
        title: 'Tree',
        dataType: 'string',
      },
    ];
  }

  getEditors(): EditorDefinition<ToTreeNode>[] {
    return [
      {
        type: 'string',
        label: 'Children Property',
        dataKey: 'childrenProperty',
      },
      {
        type: 'code',
        label: 'Format',
        dataKey: 'format',
        language: 'prompt-interpolation-markdown',
        theme: 'prompt-interpolation',
      },
      {
        type: 'toggle',
        label: 'Sort Alphabetically',
        dataKey: 'useSortAlphabetically',
      },
    ];
  }

  getBody(): string {
    return dedent`
      Format: ${this.data.format}
      Children: ${this.data.childrenProperty}
      Sort: ${this.data.useSortAlphabetically ? 'Yes' : 'No'}
    `;
  }

  static getUIData(): NodeUIData {
    return {
      infoBoxBody: dedent`
        Converts an array of objects into a tree structure and renders it as text.

        The format field supports interpolation using {{property}} syntax to determine
        how each node is displayed.

        Use the children property to specify which field contains child nodes.
      `,
      infoBoxTitle: 'To Tree Node',
      contextMenuTitle: 'To Tree',
      group: ['Text'],
    };
  }

  buildTree(objects: unknown[], parentPath: string = '', level: number = 0, isLast: boolean = true): string {
    if (!Array.isArray(objects) || objects.length === 0) return '';

    let result = '';
    const sortedObjects = this.data.useSortAlphabetically
      ? sortBy(objects, (obj) => String(get(obj, 'path', '')))
      : objects;

    sortedObjects.forEach((obj, index) => {
      const isLastItem = index === sortedObjects.length - 1;
      const prefix = level === 0 ? '' : isLast ? '└── ' : '├── ';
      const indent = level === 0 ? '' : '    '.repeat(level - 1) + (isLast ? '    ' : '│   ');

      // Get all potential interpolation variables from the format string
      const matches = extractInterpolationVariables(this.data.format);
      const interpolationVars = matches.reduce(
        (acc, match) => {
          const key = match;
          acc[key] = String(get(obj, key, ''));
          return acc;
        },
        {} as Record<string, string>,
      );

      const formattedNode = interpolate(this.data.format, interpolationVars);

      // Add this node to the result
      result += indent + prefix + formattedNode + '\n';

      // Process children if they exist
      const children = get(obj, this.data.childrenProperty);
      if (Array.isArray(children) && children.length > 0) {
        const newPath = parentPath ? `${parentPath}/${formattedNode}` : formattedNode;
        result += this.buildTree(children, newPath, level + 1, isLastItem);
      }
    });

    return result;
  }

  async process(inputs: Record<PortId, DataValue>): Promise<Record<PortId, DataValue>> {
    const objects = coerceTypeOptional(inputs['objects' as PortId], 'object[]') ?? [];
    const treeOutput = this.buildTree(objects);

    return {
      ['tree' as PortId]: {
        type: 'string',
        value: treeOutput,
      },
    };
  }
}

export const toTreeNode = nodeDefinition(ToTreeNodeImpl, 'To Tree');
