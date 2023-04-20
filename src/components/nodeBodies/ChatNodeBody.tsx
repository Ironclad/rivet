// components/nodeBodies/ChatNodeBody.tsx
import React from 'react';
import { ChatNode } from '../../model/nodes/ChatNode';
import { css } from '@emotion/react';

type ChatNodeBodyProps = {
  node: ChatNode;
};

const styles = css`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const ChatNodeBody: React.FC<ChatNodeBodyProps> = ({ node }) => {
  return (
    <div css={styles}>
      <div>Model: {node.data.model}</div>
      <div>
        {node.data.useTopP ? 'Top P' : 'Temperature'}: {node.data.useTopP ? node.data.top_p : node.data.temperature}
      </div>
      <div>Max Tokens: {node.data.maxTokens}</div>
    </div>
  );
};
