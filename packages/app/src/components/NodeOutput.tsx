import { useRecoilState, useRecoilValue } from 'recoil';
import { NodeRunData, ProcessDataForNode, lastRunData, selectedProcessPage } from '../state/dataFlow';
import { FC, ReactNode, memo, useMemo, useState } from 'react';
import { useUnknownNodeComponentDescriptorFor } from '../hooks/useNodeTypes';
import { useStableCallback } from '../hooks/useStableCallback';
import { copyToClipboard } from '../utils/copyToClipboard';
import { ChartNode, PortId } from '@ironclad/nodai-core';
import { css } from '@emotion/react';
import { ReactComponent as CopyIcon } from 'majesticons/line/clipboard-line.svg';
import { ReactComponent as ExpandIcon } from 'majesticons/line/maximize-line.svg';
import { FullScreenModal } from './FullScreenModal';
import { getWarnings } from '../utils/outputs';
import { RenderDataOutputs } from './RenderDataValue';
import { entries } from '../utils/typeSafety';
import { orderBy } from 'lodash-es';

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
  const [isModalOpen, setIsModalOpen] = useState(false);

  // const { FullscreenOutput } = useUnknownNodeComponentDescriptorFor(node);

  const handleScroll = useStableCallback((e: React.UIEvent<HTMLDivElement, UIEvent>) => {
    e.stopPropagation();
  });

  // const fullscreenOutputBody = FullscreenOutput ? <FullscreenOutput node={node} /> : null;

  return (
    <div className="node-output-outer">
      <FullScreenModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div css={fullscreenOutputButtonsCss}>
          <div className="copy-button">
            <CopyIcon />
          </div>
        </div>
        {/* {fullscreenOutputBody ? fullscreenOutputBody : outputBody} */}
      </FullScreenModal>
      <div onScroll={handleScroll}>
        <NodeOutputBase node={node} />
      </div>
    </div>
  );
});

const NodeOutputBase: FC<{ node: ChartNode; children?: ReactNode; onOpenFullscreenModal?: () => void }> = ({
  node,
  children,
  onOpenFullscreenModal,
}) => {
  const output = useRecoilValue(lastRunData(node.id));

  if (!output?.length) {
    return null;
  }

  if (output.length === 1) {
    return (
      <div className="node-output">
        <NodeOutputSingleProcess node={node} data={output[0]!.data} onOpenFullscreenModal={onOpenFullscreenModal} />
      </div>
    );
  } else {
    return (
      <div className="node-output multi">
        <NodeOutputMultiProcess node={node} data={output} />
      </div>
    );
  }
};

const NodeOutputSingleProcess: FC<{
  node: ChartNode;
  data: NodeRunData;
  onOpenFullscreenModal?: () => void;
}> = ({ node, data, onOpenFullscreenModal }) => {
  const { Output, OutputSimple } = useUnknownNodeComponentDescriptorFor(node);

  const handleCopyToClipboard = useStableCallback(() => {
    const keys = Object.keys(data.outputData ?? {}) as PortId[];

    if (keys.length === 1) {
      const outputValue = data.outputData![keys[0]!]!;
      if (outputValue.type === 'string') {
        copyToClipboard(outputValue.value);
      } else if (outputValue.type === 'chat-message') {
        copyToClipboard(outputValue.value.message);
      } else {
        copyToClipboard(JSON.stringify(outputValue, null, 2));
      }
      return;
    }

    copyToClipboard(JSON.stringify(data.outputData, null, 2));
  });

  if (data.status?.type === 'error') {
    return <div className="node-output-inner errored">{data.status.error}</div>;
  }

  if (!data.outputData) {
    return null;
  }

  let body: ReactNode;

  if (Output) {
    body = <Output node={node} />;
  } else if (data.splitOutputData) {
    const outputs = orderBy(
      entries(data.splitOutputData).map(([key, value]) => ({ key, value })),
      (x) => x.key,
    );

    body = (
      <div className="split-output">
        {outputs.map(({ key, value }) =>
          OutputSimple ? (
            <OutputSimple key={`outputs-${key}`} outputs={value} />
          ) : (
            <RenderDataOutputs key={`outputs-${key}`} outputs={value} />
          ),
        )}
      </div>
    );
  } else {
    body = OutputSimple ? <OutputSimple outputs={data.outputData} /> : <RenderDataOutputs outputs={data.outputData} />;
  }

  return (
    <div className="node-output-inner">
      <div className="overlay-buttons">
        <div className="copy-button" onClick={handleCopyToClipboard}>
          <CopyIcon />
        </div>
        <div
          className="expand-button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenFullscreenModal?.();
          }}
        >
          <ExpandIcon />
        </div>
      </div>
      {body}
      {getWarnings(data.outputData) && (
        <div className="node-output-warnings">
          {getWarnings(data.outputData)!.map((warning) => (
            <div className="node-output-warning" key={warning}>
              {warning}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const NodeOutputMultiProcess: FC<{ node: ChartNode; data: ProcessDataForNode[] }> = ({ node, data }) => {
  let [selectedPage, setSelectedPage] = useRecoilState(selectedProcessPage(node.id));

  const prevPage = useStableCallback(() => {
    setSelectedPage((page) => {
      const pageNum = page === 'latest' ? data.length : page;
      return pageNum > 0 ? pageNum - 1 : pageNum;
    });
  });

  const nextPage = useStableCallback(() => {
    setSelectedPage((page) => {
      const pageNum = page === 'latest' ? data.length : page;
      return pageNum < data.length - 1 ? pageNum + 1 : pageNum;
    });
  });

  const selectedData = useMemo(
    () => data[selectedPage === 'latest' ? data.length - 1 : selectedPage],
    [data, selectedPage],
  );

  return (
    <div className="node-output multi">
      <div className="multi-node-output">
        <div className="picker">
          <button className="picker-left" onClick={prevPage}>
            {'<'}
          </button>
          <div className="picker-page">{selectedPage === 'latest' ? data.length : selectedPage + 1}</div>
          <button className="picker-right" onClick={nextPage}>
            {'>'}
          </button>
        </div>
      </div>
      {selectedData && <NodeOutputSingleProcess data={selectedData.data} node={node} />}
    </div>
  );
};
