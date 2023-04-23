import { useRecoilValue } from 'recoil';
import { lastRunData } from '../state/dataFlow';
import { match } from 'ts-pattern';
import { FC, memo, useState } from 'react';
import clsx from 'clsx';
import { ChartNode, PortId } from '../model/NodeBase';
import { ChatNode } from '../model/nodes/ChatNode';
import { CodeNode } from '../model/nodes/CodeNode';
import { ExtractRegexNode } from '../model/nodes/ExtractRegexNode';
import { MatchNode } from '../model/nodes/MatchNode';
import { PromptNode } from '../model/nodes/PromptNode';
import { TextNode } from '../model/nodes/TextNode';
import { UserInputNode } from '../model/nodes/UserInputNode';
import { ChatNodeOutput, FullscreenChatNodeOutput } from './nodes/ChatNode';
import { CodeNodeOutput } from './nodes/CodeNode';
import { ExtractRegexNodeOutput } from './nodes/ExtractRegexNode';
import { MatchNodeOutput } from './nodes/MatchNode';
import { PromptNodeOutput } from './nodes/PromptNode';
import { TextNodeOutput } from './nodes/TextNode';
import { UserInputNodeOutput } from './nodes/UserInputNode';
import { copyToClipboard } from '../utils/copyToClipboard';
import { ReactComponent as CopyIcon } from 'majesticons/line/clipboard-line.svg';
import { ReactComponent as ExpandIcon } from 'majesticons/line/maximize-line.svg';
import { FullScreenModal } from './FullScreenModal';
import { css } from '@emotion/react';

const fullscreenOutputButtonsCss = css`
  position: absolute;
  top: 16px;
  right: 4px;
  display: flex;
  gap: 8px;

  .copy-button {
    width: 24px;
    height: 24px;
    font-size: 24px;
    opacity: 0.2;
    cursor: pointer;
    transition: opacity 0.2s;
    z-index: 1;
  }

  .copy-button:hover {
    opacity: 1;
  }
`;

export const NodeOutput: FC<{ node: ChartNode }> = memo(({ node }) => {
  const nodeOutput = useRecoilValue(lastRunData(node.id));
  const [isModalOpen, setIsModalOpen] = useState(false);

  const outputBody = match(node)
    .with({ type: 'prompt' }, (node) => <PromptNodeOutput node={node as PromptNode} />)
    .with({ type: 'chat' }, (node) => <ChatNodeOutput node={node as ChatNode} />)
    .with({ type: 'text' }, (node) => <TextNodeOutput node={node as TextNode} />)
    .with({ type: 'extractRegex' }, (node) => <ExtractRegexNodeOutput node={node as ExtractRegexNode} />)
    .with({ type: 'code' }, (node) => <CodeNodeOutput node={node as CodeNode} />)
    .with({ type: 'match' }, (node) => <MatchNodeOutput node={node as MatchNode} />)
    .with({ type: 'userInput' }, (node) => <UserInputNodeOutput node={node as UserInputNode} />)
    .otherwise(() => null);

  if (!nodeOutput?.status) {
    return null;
  }

  const fullscreenOutputBody = match(node)
    .with({ type: 'chat' }, (node) => <FullscreenChatNodeOutput node={node as ChatNode} />)
    .otherwise(() => null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement, UIEvent>) => {
    e.stopPropagation();
  };

  const handleCopyToClipboard = () => {
    const keys = Object.keys(nodeOutput.outputData ?? {}) as PortId[];

    if (keys.length === 1) {
      const outputValue = nodeOutput.outputData![keys[0]];
      if (outputValue.type === 'string') {
        copyToClipboard(outputValue.value);
      } else if (outputValue.type === 'chat-message') {
        copyToClipboard(outputValue.value.message);
      } else {
        copyToClipboard(JSON.stringify(outputValue, null, 2));
      }
      return;
    }

    copyToClipboard(JSON.stringify(nodeOutput.outputData, null, 2));
  };

  const renderCopyButton = () => (
    <div className="copy-button" onClick={handleCopyToClipboard}>
      <CopyIcon />
    </div>
  );

  return (
    <div className="node-output">
      <div className="overlay-buttons">
        {renderCopyButton()}
        <div
          className="expand-button"
          onClick={(e) => {
            e.stopPropagation();
            setIsModalOpen(true);
          }}
        >
          <ExpandIcon />
        </div>
      </div>

      <FullScreenModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div css={fullscreenOutputButtonsCss}>{renderCopyButton()}</div>
        {fullscreenOutputBody ? fullscreenOutputBody : outputBody}
      </FullScreenModal>
      <div
        onScroll={handleScroll}
        className={clsx('node-output-inner', { errored: nodeOutput.status?.type === 'error' })}
      >
        {outputBody}
      </div>
    </div>
  );
});
