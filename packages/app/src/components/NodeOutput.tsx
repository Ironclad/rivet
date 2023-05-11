import { useRecoilValue } from 'recoil';
import { lastRunData } from '../state/dataFlow';
import { match } from 'ts-pattern';
import { FC, memo, useState } from 'react';
import clsx from 'clsx';

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
import { getWarnings } from '../utils/outputs';
import { ChartNode, ChatNode, Nodes, PortId } from '@ironclad/nodai-core';
import { ReadDirectoryNodeOutput } from './nodes/ReadDirectoryNode';
import { ReadFileNodeOutput } from './nodes/ReadFileNode';
import { IfElseNodeOutput } from './nodes/IfElseNode';
import { ChunkNodeOutput } from './nodes/ChunkNode';
import { GraphInputNodeOutput } from './nodes/GraphInputNode';
import { GraphOutputNodeOutput } from './nodes/GraphOutputNode';
import { SubGraphNodeOutput } from './nodes/SubGraphNode';
import { ExtractJsonNodeOutput } from './nodes/ExtractJsonNode';
import { AssemblePromptNodeOutput } from './nodes/AssemblePromptNode';

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

  if (!nodeOutput?.status) {
    return null;
  }

  const outputBody = match(node as Nodes)
    .with({ type: 'prompt' }, (node) => <PromptNodeOutput node={node} />)
    .with({ type: 'chat' }, (node) => <ChatNodeOutput node={node} />)
    .with({ type: 'text' }, (node) => <TextNodeOutput node={node} />)
    .with({ type: 'extractRegex' }, (node) => <ExtractRegexNodeOutput node={node} />)
    .with({ type: 'code' }, (node) => <CodeNodeOutput node={node} />)
    .with({ type: 'match' }, (node) => <MatchNodeOutput node={node} />)
    .with({ type: 'userInput' }, (node) => <UserInputNodeOutput node={node} />)
    .with({ type: 'readDirectory' }, (node) => <ReadDirectoryNodeOutput node={node} />)
    .with({ type: 'readFile' }, (node) => <ReadFileNodeOutput node={node} />)
    .with({ type: 'ifElse' }, (node) => <IfElseNodeOutput node={node} />)
    .with({ type: 'chunk' }, (node) => <ChunkNodeOutput node={node} />)
    .with({ type: 'graphInput' }, (node) => <GraphInputNodeOutput node={node} />)
    .with({ type: 'graphOutput' }, (node) => <GraphOutputNodeOutput node={node} />)
    .with({ type: 'subGraph' }, (node) => <SubGraphNodeOutput node={node} />)
    .with({ type: 'extractJson' }, (node) => <ExtractJsonNodeOutput node={node} />)
    .with({ type: 'assemblePrompt' }, (node) => <AssemblePromptNodeOutput node={node} />)
    .otherwise(() => null);

  const fullscreenOutputBody = match(node as Nodes)
    .with({ type: 'chat' }, (node) => <FullscreenChatNodeOutput node={node as ChatNode} />)
    .otherwise(() => null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement, UIEvent>) => {
    e.stopPropagation();
  };

  const handleCopyToClipboard = () => {
    const keys = Object.keys(nodeOutput.outputData ?? {}) as PortId[];

    if (keys.length === 1) {
      const outputValue = nodeOutput.outputData![keys[0]!]!;
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
      {getWarnings(nodeOutput?.outputData) && (
        <div className="node-output-warnings">
          {getWarnings(nodeOutput?.outputData)!.map((warning) => (
            <div className="node-output-warning" key={warning}>
              {warning}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
