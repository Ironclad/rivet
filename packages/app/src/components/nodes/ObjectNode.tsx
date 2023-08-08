import { FC, useMemo } from 'react';
import styled from '@emotion/styled';
import { ObjectNode } from '@ironclad/rivet-core';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';
import { LazyColorizedPreformattedText } from '../LazyComponents';

export type ObjectNodeBodyProps = {
  node: ObjectNode;
};

const Body = styled.div`
  font-size: 12px;

  pre {
    white-space: pre-wrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

export const ObjectNodeBody: FC<ObjectNodeBodyProps> = ({ node }) => {
  const truncated = useMemo(
    () => node.data.jsonTemplate.split('\n').slice(0, 15).join('\n').trim(),
    [node.data.jsonTemplate],
  );

  return (
    <Body>
      <LazyColorizedPreformattedText text={truncated} language="json" />
    </Body>
  );
};

export const ObjectNodeDescriptor: NodeComponentDescriptor<'object'> = {
  Body: ObjectNodeBody,
};
