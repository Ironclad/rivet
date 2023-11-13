import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { type NodeRunData, type ProcessDataForNode, lastRunData, selectedProcessPage } from '../state/dataFlow.js';
import { type FC, type ReactNode, memo, useMemo, useState, type MouseEvent } from 'react';
import { useUnknownNodeComponentDescriptorFor } from '../hooks/useNodeTypes.js';
import { useStableCallback } from '../hooks/useStableCallback.js';
import { copyToClipboard } from '../utils/copyToClipboard.js';
import { type ChartNode, type PortId, type ProcessId, getWarnings } from '@ironclad/rivet-core';
import { css } from '@emotion/react';
import CopyIcon from 'majesticons/line/clipboard-line.svg?react';
import ExpandIcon from 'majesticons/line/maximize-line.svg?react';
import FlaskIcon from 'majesticons/line/flask-line.svg?react';
import { FullScreenModal } from './FullScreenModal.js';
import { RenderDataOutputs } from './RenderDataValue.js';
import { orderBy } from 'lodash-es';
import { promptDesignerAttachedChatNodeState } from '../state/promptDesigner.js';
import { overlayOpenState } from '../state/ui';
import { useDependsOnPlugins } from '../hooks/useDependsOnPlugins';
import { entries } from '../../../core/src/utils/typeSafety';
import { useToggle } from 'ahooks';
import Toggle from '@atlaskit/toggle';
import { pinnedNodesState } from '../state/graphBuilder';
import { useNodeIO } from '../hooks/useGetNodeIO';
import { Tooltip } from './Tooltip';

export const NodeOutput: FC<{ node: ChartNode }> = memo(({ node }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  useDependsOnPlugins();

  const isPinned = useRecoilValue(pinnedNodesState).includes(node.id);

  const handleWheel = useStableCallback((e: MouseEvent<HTMLDivElement>) => {
    if (isPinned) {
      return; // Scroll is allowed because there's no scroll bar when pinned
    }

    // Prevent zooming the graph when scrolling the output
    e.stopPropagation();
  });

  return (
    <div className="node-output-outer">
      <FullScreenModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <NodeFullscreenOutput node={node} />
      </FullScreenModal>
      <div onWheel={handleWheel}>
        <NodeOutputBase node={node} onOpenFullscreenModal={() => setIsModalOpen(true)} />
      </div>
    </div>
  );
});

NodeOutput.displayName = 'NodeOutput';

const fullscreenOutputCss = css`
  position: relative;

  .fullscreen-header {
    position: sticky;
    top: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .picker {
    position: sticky;
    top: 0;
    left: 0;
    border: 1px solid var(--grey);
    background: var(--grey-darker);
    display: inline-flex;
    gap: 0;
    border-radius: 4px;
    box-shadow: 4px 4px 8px var(--shadow-dark);
    margin-bottom: 8px;

    .picker-left,
    .picker-right {
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      cursor: pointer;
      border: 0;
      margin: 0;
      padding: 0;
      width: 32px;
      height: 32px;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }
    }

    .picker-left {
      border-right: 1px solid rgba(255, 255, 255, 0.1);
    }

    .picker-right {
      border-left: 1px solid rgba(255, 255, 255, 0.1);
    }

    .picker-page {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
    }
  }
`;

const fullscreenOutputButtonsCss = css`
  display: inline-flex;
  gap: 8px;

  border: 1px solid var(--grey);
  background: var(--grey-darker);
  border-radius: 4px;
  box-shadow: 4px 4px 8px var(--shadow-dark);
  margin-bottom: 8px;
  padding: 8px 12px;

  .copy-button,
  .prompt-designer-button {
    width: 24px;
    height: 24px;
    font-size: 24px;
    opacity: 0.2;
    cursor: pointer;
    transition: opacity 0.2s;
    z-index: 1;
  }

  .copy-button:hover,
  .prompt-designer-button:hover {
    opacity: 1;
  }

  .copy-json-button {
    opacity: 0.2;
    cursor: pointer;
    user-select: none;
    text-transform: uppercase;
    font-size: 10px;
    transition: opacity 0.2s;
    z-index: 1;
    height: 24px;
    display: inline-flex;
    align-items: center;

    &:hover {
      opacity: 1;
    }
  }

  .markdown-toggle {
    display: flex;
    align-items: center;
    user-select: none;
  }
`;

const NodeFullscreenOutput: FC<{ node: ChartNode }> = ({ node }) => {
  const output = useRecoilValue(lastRunData(node.id));
  const [selectedPage, setSelectedPage] = useRecoilState(selectedProcessPage(node.id));

  const { FullscreenOutput, Output, OutputSimple, FullscreenOutputSimple, defaultRenderMarkdown } =
    useUnknownNodeComponentDescriptorFor(node);

  const [renderMarkdown, toggleRenderMarkdown] = useToggle(defaultRenderMarkdown ?? false);

  const setOverlayOpen = useSetRecoilState(overlayOpenState);
  const setPromptDesignerAttachedNode = useSetRecoilState(promptDesignerAttachedChatNodeState);

  const io = useNodeIO(node.id);

  const { data, processId } = useMemo(() => {
    if (!output?.length) {
      return { data: undefined, processId: undefined };
    }

    if (output.length === 1) {
      return output[0]!;
    } else {
      return output[selectedPage === 'latest' ? output.length - 1 : selectedPage]!;
    }
  }, [output, selectedPage]);

  const handleOpenPromptDesigner = () => {
    setOverlayOpen('promptDesigner');
    setPromptDesignerAttachedNode({
      nodeId: node.id,
      processId: processId!,
    });
  };

  const handleCopyToClipboard = useStableCallback(() => {
    if (!data) {
      return;
    }
    const keys = Object.keys(data.outputData ?? {}) as PortId[];

    if (keys.length > 1) {
      copyToClipboard(JSON.stringify(data.outputData, null, 2));
      return;
    }

    const outputValue = data.outputData![keys[0]!]!;
    if (outputValue.type === 'string') {
      copyToClipboard(outputValue.value);
    } else if (outputValue.type === 'chat-message') {
      if (Array.isArray(outputValue.value)) {
        const singleString = outputValue.value.map((v) => (typeof v === 'string' ? v : '(Image)')).join('\n\n');
        copyToClipboard(singleString);
      } else {
        copyToClipboard(typeof outputValue.value.message === 'string' ? outputValue.value.message : '(Image)');
      }
    } else {
      copyToClipboard(JSON.stringify(outputValue, null, 2));
    }
  });

  const handleCopyToClipboardJson = useStableCallback(() => {
    if (!data) {
      return;
    }
    copyToClipboard(JSON.stringify(data.outputData, null, 2));
  });

  const prevPage = useStableCallback(() => {
    if (!output) {
      return;
    }
    setSelectedPage((page) => {
      const pageNum = page === 'latest' ? output.length - 1 : page;
      return pageNum > 0 ? pageNum - 1 : pageNum;
    });
  });

  const nextPage = useStableCallback(() => {
    if (!output) {
      return;
    }
    setSelectedPage((page) => {
      const pageNum = page === 'latest' ? output.length - 1 : page;
      return pageNum < output.length - 1 ? pageNum + 1 : pageNum;
    });
  });

  if (!output || !data) {
    return null;
  }

  if (data.status?.type === 'error') {
    return <div className="errored">{data.status.error}</div>;
  }

  if (!data.outputData && !data.splitOutputData) {
    return null;
  }

  let body: ReactNode;

  if (FullscreenOutput) {
    body = <FullscreenOutput node={node} />;
  } else if (Output) {
    body = <Output node={node} />;
  } else if (data.splitOutputData) {
    const outputs = orderBy(
      entries(data.splitOutputData).map(([key, value]) => ({ key, value })),
      (x) => x.key,
    );

    body = (
      <div className="split-output">
        {outputs.map(({ key, value }) =>
          FullscreenOutputSimple ? (
            <FullscreenOutputSimple key={`outputs-${key}`} outputs={value} renderMarkdown={renderMarkdown} />
          ) : OutputSimple ? (
            <OutputSimple key={`outputs-${key}`} outputs={value} />
          ) : (
            <RenderDataOutputs
              key={`outputs-${key}`}
              definitions={io.outputDefinitions}
              outputs={value}
              renderMarkdown={renderMarkdown}
            />
          ),
        )}
      </div>
    );
  } else {
    body = FullscreenOutputSimple ? (
      <FullscreenOutputSimple outputs={data.outputData!} renderMarkdown={renderMarkdown} />
    ) : OutputSimple ? (
      <OutputSimple outputs={data.outputData!} />
    ) : (
      <RenderDataOutputs
        definitions={io.outputDefinitions}
        outputs={data.outputData!}
        renderMarkdown={renderMarkdown}
      />
    );
  }

  return (
    <div css={fullscreenOutputCss}>
      <header className="fullscreen-header">
        {output.length > 1 ? (
          <div className="picker">
            <button className="picker-left" onClick={prevPage}>
              {'<'}
            </button>
            <div className="picker-page">{selectedPage === 'latest' ? output.length : selectedPage + 1}</div>
            <button className="picker-right" onClick={nextPage}>
              {'>'}
            </button>
          </div>
        ) : (
          <div />
        )}
        <div css={fullscreenOutputButtonsCss}>
          <label className="markdown-toggle">
            <Toggle isChecked={renderMarkdown} onChange={toggleRenderMarkdown.toggle} /> Render Markdown
          </label>
          <div className="copy-button" onClick={handleCopyToClipboard} title="Copy Value">
            <CopyIcon />
          </div>
          <div className="copy-json-button" onClick={handleCopyToClipboardJson} title="Copy as JSON">
            JSON
          </div>
          {node.type === 'chat' && (
            <div className="prompt-designer-button" onClick={handleOpenPromptDesigner}>
              <FlaskIcon />
            </div>
          )}
        </div>
      </header>

      <div className="fullscreen-output-body">{body}</div>
    </div>
  );
};

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
        <NodeOutputSingleProcess
          node={node}
          data={output[0]!.data}
          processId={output[0]!.processId}
          onOpenFullscreenModal={onOpenFullscreenModal}
        />
      </div>
    );
  } else {
    return (
      <div className="node-output multi">
        <NodeOutputMultiProcess node={node} data={output} onOpenFullscreenModal={onOpenFullscreenModal} />
      </div>
    );
  }
};

const NodeOutputSingleProcess: FC<{
  node: ChartNode;
  data: NodeRunData;
  processId: ProcessId;
  onOpenFullscreenModal?: () => void;
}> = ({ node, data, processId, onOpenFullscreenModal }) => {
  const { Output, OutputSimple } = useUnknownNodeComponentDescriptorFor(node);

  const setOverlayOpen = useSetRecoilState(overlayOpenState);
  const setPromptDesignerAttachedNode = useSetRecoilState(promptDesignerAttachedChatNodeState);
  const io = useNodeIO(node.id);

  const handleOpenPromptDesigner = () => {
    setOverlayOpen('promptDesigner');
    setPromptDesignerAttachedNode({
      nodeId: node.id,
      processId: processId!,
    });
  };

  const handleCopyToClipboard = useStableCallback(() => {
    const keys = Object.keys(data.outputData ?? {}) as PortId[];

    if (keys.length === 1) {
      const outputValue = data.outputData![keys[0]!]!;
      if (outputValue.type === 'string') {
        copyToClipboard(outputValue.value);
      } else if (outputValue.type === 'chat-message') {
        if (Array.isArray(outputValue.value)) {
          const singleString = outputValue.value.map((v) => (typeof v === 'string' ? v : '(Image)')).join('\n\n');
          copyToClipboard(singleString);
        } else {
          copyToClipboard(typeof outputValue.value.message === 'string' ? outputValue.value.message : '(Image)');
        }
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

  if (!data.outputData && !data.splitOutputData) {
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
            <RenderDataOutputs definitions={io.outputDefinitions} key={`outputs-${key}`} outputs={value} />
          ),
        )}
      </div>
    );
  } else {
    body = OutputSimple ? (
      <OutputSimple outputs={data.outputData!} />
    ) : (
      <RenderDataOutputs definitions={io.outputDefinitions} outputs={data.outputData!} />
    );
  }

  return (
    <div className="node-output-inner">
      <div className="overlay-buttons">
        <Tooltip content="Copy node output to clipboard">
          <div className="copy-button" onClick={handleCopyToClipboard}>
            <CopyIcon />
          </div>
        </Tooltip>

        {node.type === 'chat' && (
          <Tooltip content="Open chat in Prompt Designer">
            <div className="prompt-designer-button" onClick={handleOpenPromptDesigner}>
              <FlaskIcon />
            </div>
          </Tooltip>
        )}
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

const NodeOutputMultiProcess: FC<{
  node: ChartNode;
  data: ProcessDataForNode[];
  onOpenFullscreenModal?: () => void;
}> = ({ node, data, onOpenFullscreenModal }) => {
  const [selectedPage, setSelectedPage] = useRecoilState(selectedProcessPage(node.id));

  const prevPage = useStableCallback(() => {
    setSelectedPage((page) => {
      const pageNum = page === 'latest' ? data.length - 1 : page;
      return pageNum > 0 ? pageNum - 1 : pageNum;
    });
  });

  const nextPage = useStableCallback(() => {
    setSelectedPage((page) => {
      const pageNum = page === 'latest' ? data.length - 1 : page;
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
          <button className="picker-left" onClick={prevPage} onDoubleClick={(e) => e.stopPropagation()}>
            {'<'}
          </button>
          <div className="picker-page">{selectedPage === 'latest' ? data.length : selectedPage + 1}</div>
          <button className="picker-right" onClick={nextPage} onDoubleClick={(e) => e.stopPropagation()}>
            {'>'}
          </button>
        </div>
      </div>
      {selectedData && (
        <NodeOutputSingleProcess
          data={selectedData.data}
          node={node}
          processId={selectedData.processId}
          onOpenFullscreenModal={onOpenFullscreenModal}
        />
      )}
    </div>
  );
};
