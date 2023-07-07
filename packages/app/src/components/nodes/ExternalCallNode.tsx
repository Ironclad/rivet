import { FC } from 'react';
import { ExternalCallNode } from '@ironclad/rivet-core';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes.js';

export type ExternalCallNodeBodyProps = {
  node: ExternalCallNode;
};

export const ExternalCallNodeBody: FC<ExternalCallNodeBodyProps> = ({ node }) => {
  return <div>{node.data.useFunctionNameInput ? '(Using Input)' : node.data.functionName}</div>;
};

export const externalCallNodeDescriptor: NodeComponentDescriptor<'externalCall'> = {
  Body: ExternalCallNodeBody,
};
