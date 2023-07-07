import { FC } from 'react';
import styled from '@emotion/styled';
import { ExtractRegexNode } from '@ironclad/rivet-core';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes.js';

export type ExtractRegexNodeBodyProps = {
  node: ExtractRegexNode;
};

const Body = styled.div`
  font-size: 12px;
`;

export const ExtractRegexNodeBody: FC<ExtractRegexNodeBodyProps> = ({ node }) => {
  if (node.data.useRegexInput) {
    return <Body>(Using regex input)</Body>;
  }

  return <Body>{node.data.regex}</Body>;
};

export const extractRegexNodeDescriptor: NodeComponentDescriptor<'extractRegex'> = {
  Body: ExtractRegexNodeBody,
};
