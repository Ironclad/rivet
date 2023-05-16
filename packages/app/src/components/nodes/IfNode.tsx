import { FC } from 'react';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';

export type IfNodeBodyProps = {};

export const IfNodeBody: FC<IfNodeBodyProps> = () => {
  return null;
};

export const IfNodeEditor: FC<IfNodeBodyProps> = () => {
  return null;
};

export const ifNodeDescriptor: NodeComponentDescriptor<'if'> = {
  Body: IfNodeBody,
  Output: undefined,
  Editor: IfNodeEditor,
};
