import { FC, memo, useMemo } from 'react';
import { useUnknownNodeComponentDescriptorFor } from '../hooks/useNodeTypes';
import { ChartNode, createUnknownNodeInstance } from '@ironclad/rivet-core';

const UnknownNodeBody: FC<{ node: ChartNode }> = ({ node }) => {
  const body = useMemo(() => createUnknownNodeInstance(node).getBody(), [node]);

  return <pre className="pre-wrap">{body}</pre>;
};

export const NodeBody: FC<{ node: ChartNode }> = memo(({ node }) => {
  const { Body } = useUnknownNodeComponentDescriptorFor(node);

  const body = Body ? <Body node={node} /> : <UnknownNodeBody node={node} />;

  return <div className="node-body">{body}</div>;
});
