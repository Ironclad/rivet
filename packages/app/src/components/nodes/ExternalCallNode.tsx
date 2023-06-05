import { FC } from 'react';
import { ExternalCallNode } from '@ironclad/nodai-core';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';

export type ExternalCallNodeBodyProps = {
  node: ExternalCallNode;
};

export const ExternalCallNodeBody: FC<ExternalCallNodeBodyProps> = ({ node }) => {
  return <div>{node.data.useFunctionNameInput ? '(Using Input)' : node.data.functionName}</div>;
};

export const externalCallNodeDescriptor: NodeComponentDescriptor<'externalCall'> = {
  Body: ExternalCallNodeBody,
};
