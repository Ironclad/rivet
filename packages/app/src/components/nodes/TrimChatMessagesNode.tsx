import { FC } from 'react';
import styled from '@emotion/styled';
import { TrimChatMessagesNode } from '@ironclad/rivet-core';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';

export type TrimChatMessagesNodeBodyProps = {
  node: TrimChatMessagesNode;
};

const Body = styled.div`
  font-size: 12px;
`;

export const TrimChatMessagesNodeBody: FC<TrimChatMessagesNodeBodyProps> = ({ node }) => {
  return (
    <Body>
      Max Token Count: {node.data.maxTokenCount}
      <br />
      Remove From Beginning: {node.data.removeFromBeginning ? 'Yes' : 'No'}
    </Body>
  );
};

export interface TrimChatMessagesNodeOutputProps {
  node: TrimChatMessagesNode;
}

export const trimChatMessagesNodeDescriptor: NodeComponentDescriptor<'trimChatMessages'> = {
  Body: TrimChatMessagesNodeBody,
};
