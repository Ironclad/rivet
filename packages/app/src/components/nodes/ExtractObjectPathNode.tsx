import { FC } from 'react';
import { ExtractObjectPathNode } from '@ironclad/rivet-core';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';

export type ExtractObjectPathNodeBodyProps = {
  node: ExtractObjectPathNode;
};

export const ExtractObjectPathNodeBody: FC<ExtractObjectPathNodeBodyProps> = ({ node }) => {
  return <div>{node.data.usePathInput ? '(Using Input)' : node.data.path}</div>;
};
export const extractObjectPathNodeDescriptor: NodeComponentDescriptor<'extractObjectPath'> = {
  Body: ExtractObjectPathNodeBody,
};
