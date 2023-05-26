import { FC } from 'react';
import { ExtractJsonNode } from '@ironclad/nodai-core';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';

export type ExtractJsonNodeBodyProps = {
  node: ExtractJsonNode;
};

export const ExtractJsonNodeBody: FC<ExtractJsonNodeBodyProps> = () => {
  return <div>Extract JSON</div>;
};

export type ExtractJsonNodeEditorProps = {
  node: ExtractJsonNode;
  onChange?: (node: ExtractJsonNode) => void;
};

export const ExtractJsonNodeEditor: FC<ExtractJsonNodeEditorProps> = () => {
  return <div>No settings available for this node.</div>;
};

export const extractJsonNodeDescriptor: NodeComponentDescriptor<'extractJson'> = {
  Body: ExtractJsonNodeBody,
  Output: undefined,
  Editor: ExtractJsonNodeEditor,
};
