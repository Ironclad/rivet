import { FC, memo, useMemo } from 'react';
import { useUnknownNodeComponentDescriptorFor } from '../hooks/useNodeTypes.js';
import { ChartNode, createUnknownNodeInstance } from '@ironclad/rivet-core';
import { useMarkdown } from '../hooks/useMarkdown';

const UnknownNodeBody: FC<{ node: ChartNode }> = ({ node }) => {
  const body = useMemo(() => createUnknownNodeInstance(node).getBody(), [node]);

  const markdownBody = useMarkdown(body?.replace(/^!markdown/, ''), body?.startsWith('!markdown'));

  if (markdownBody.__html) {
    return <div className="pre-wrap" dangerouslySetInnerHTML={markdownBody} />;
  }

  return <pre className="pre-wrap">{body}</pre>;
};

export const NodeBody: FC<{ node: ChartNode }> = memo(({ node }) => {
  const { Body } = useUnknownNodeComponentDescriptorFor(node);

  const body = Body ? <Body node={node} /> : <UnknownNodeBody node={node} />;

  return <div className="node-body">{body}</div>;
});
