import { FC } from 'react';
import { GptFunctionNode } from '@ironclad/rivet-core';
import styled from '@emotion/styled';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';

export type GptFunctionNodeBodyProps = {
  node: GptFunctionNode;
};

const Body = styled.div`
  font-size: 12px;
`;

export const GptFunctionNodeBody: FC<GptFunctionNodeBodyProps> = ({ node }) => {
  return (
    <Body>
      <pre className="pre-wrap">
        <em>{node.data.name}</em>: {node.data.description}
      </pre>
    </Body>
  );
};

export const gptFunctionNodeDescriptor: NodeComponentDescriptor<'gptFunction'> = {
  Body: GptFunctionNodeBody,
};
