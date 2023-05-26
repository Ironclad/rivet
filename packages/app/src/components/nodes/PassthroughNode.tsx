import { FC } from 'react';
import { PassthroughNode } from '@ironclad/nodai-core';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';

export type PassthroughNodeBodyProps = { node: PassthroughNode };

export const PassthroughNodeBody: FC<PassthroughNodeBodyProps> = () => {
  return null;
};

export const PassthroughNodeEditor: FC<PassthroughNodeBodyProps> = () => {
  return null;
};

export const passthroughNodeDescriptor: NodeComponentDescriptor<'passthrough'> = {
  Body: PassthroughNodeBody,
  Output: undefined,
  Editor: PassthroughNodeEditor,
};
