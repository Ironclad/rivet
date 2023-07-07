import { FC } from 'react';
import { WaitForEventNode } from '@ironclad/rivet-core';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes.js';

export type WaitForEventNodeBodyProps = {
  node: WaitForEventNode;
};

export const WaitForEventNodeBody: FC<WaitForEventNodeBodyProps> = ({ node }) => {
  return <div>{node.data.useEventNameInput ? '(Using Input)' : node.data.eventName}</div>;
};

export const waitForEventNodeDescriptor: NodeComponentDescriptor<'waitForEvent'> = {
  Body: WaitForEventNodeBody,
};
