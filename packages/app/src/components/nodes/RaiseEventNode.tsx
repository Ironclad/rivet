import { FC } from 'react';
import { RaiseEventNode } from '@ironclad/rivet-core';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';

export type RaiseEventNodeBodyProps = {
  node: RaiseEventNode;
};

export const RaiseEventNodeBody: FC<RaiseEventNodeBodyProps> = ({ node }) => {
  return <div>{node.data.useEventNameInput ? '(Using Input)' : node.data.eventName}</div>;
};

export const RaiseEventNodeDescriptor: NodeComponentDescriptor<'raiseEvent'> = {
  Body: RaiseEventNodeBody,
};
