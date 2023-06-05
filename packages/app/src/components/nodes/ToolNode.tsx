import { FC } from 'react';
import { ToolNode } from '@ironclad/nodai-core';
import styled from '@emotion/styled';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';

export type ToolNodeBodyProps = {
  node: ToolNode;
};

const Body = styled.div`
  font-size: 12px;
`;

export const ToolNodeBody: FC<ToolNodeBodyProps> = ({ node }) => {
  return (
    <Body>
      <pre className="pre-wrap">
        <em>{node.data.name}</em>: {node.data.description}
      </pre>
    </Body>
  );
};

export const toolNodeDescriptor: NodeComponentDescriptor<'tool'> = {
  Body: ToolNodeBody,
};
