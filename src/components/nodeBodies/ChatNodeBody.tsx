// components/nodeBodies/ChatNodeBody.tsx
import React, { FC } from 'react';
import { ChatNode } from '../../model/nodes/ChatNode';
import { css } from '@emotion/react';
import { lastRunData } from '../../state/dataFlow';
import { useRecoilValue } from 'recoil';
import { PortId } from '../../model/NodeBase';
import { RenderDataValue } from '../RenderDataValue';

type ChatNodeBodyProps = {
  node: ChatNode;
};

const styles = css`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const ChatNodeBody: FC<ChatNodeBodyProps> = ({ node }) => {
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

export const ChatNodeOutput: FC<ChatNodeBodyProps> = ({ node }) => {
  const output = useRecoilValue(lastRunData(node.id));

  if (!output) {
    return null;
  }

  if (output.status?.status === 'error') {
    return <div>Error: {output.status.error}</div>;
  }

  if (!output.outputData) {
    return null;
  }

  const outputText = output.outputData['response' as PortId];
  return (
    <div className="pre-wrap">
      <RenderDataValue value={outputText} />
    </div>
  );
};
