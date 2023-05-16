import { useRecoilValue } from 'recoil';
import { lastRunData } from '../state/dataFlow';
import { FC, memo, useState } from 'react';
import clsx from 'clsx';
import { useUnknownNodeComponentDescriptorFor } from '../hooks/useNodeTypes';
import { useStableCallback } from '../hooks/useStableCallback';
import { copyToClipboard } from '../utils/copyToClipboard';
import { ChartNode, PortId } from '@ironclad/nodai-core';
import { css } from '@emotion/react';
import { ReactComponent as CopyIcon } from 'majesticons/line/clipboard-line.svg';
import { ReactComponent as ExpandIcon } from 'majesticons/line/maximize-line.svg';
import { FullScreenModal } from './FullScreenModal';
import { getWarnings } from '../utils/outputs';

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

  const { Output, FullscreenOutput } = useUnknownNodeComponentDescriptorFor(node);

  const handleScroll = useStableCallback((e: React.UIEvent<HTMLDivElement, UIEvent>) => {
    e.stopPropagation();
  });

  const handleCopyToClipboard = useStableCallback(() => {
    if (!nodeOutput) {
      return;
    }

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
  });

  if (!nodeOutput?.status) {
    return null;
  }

  const outputBody = Output ? <Output node={node} /> : null;

  const fullscreenOutputBody = FullscreenOutput ? <FullscreenOutput node={node} /> : null;

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
