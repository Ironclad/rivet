import { FC, memo } from 'react';
import { useUnknownNodeComponentDescriptorFor } from '../hooks/useNodeTypes';
import { ChartNode } from '@ironclad/rivet-core';

const UnknownNodeBody: FC<{ node: ChartNode }> = ({ node }) => {
  return <div></div>;
};

export const NodeBody: FC<{ node: ChartNode }> = memo(({ node }) => {
  const { Body } = useUnknownNodeComponentDescriptorFor(node);

  const body = Body ? <Body node={node} /> : <UnknownNodeBody node={node} />;

  return <div className="node-body">{body}</div>;
});
