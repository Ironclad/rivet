import { css } from '@emotion/react';
import { useMemo, type FC } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { lastRunDataByNodeState, selectedProcessPageNodesState } from '../state/dataFlow';
import { nodesState } from '../state/graph';
import LeftIcon from 'majesticons/line/chevron-left-line.svg?react';
import RightIcon from 'majesticons/line/chevron-right-line.svg?react';
import { produce } from 'immer';
import { Tooltip } from './Tooltip';

const styles = css`
  position: fixed;
  top: calc(var(--project-selector-height) + 40px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--grey-darker);
  border-radius: 4px;
  border: 1px solid var(--grey-dark);
  height: 32px;
  z-index: 50;
  display: flex;
  gap: 8px;
  box-shadow: 3px 1px 10px rgba(0, 0, 0, 0.5);
  user-select: none;

  .current {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 30px;
    min-width: 32px;
    color: var(--grey-light);
    font-size: 12px;
    pointer-events: none;
    line-height: 32px;
  }

  button {
    background: none;
    border: none;
    color: var(--grey-light);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    padding: 0;
    cursor: pointer;
    transition:
      color 0.2s ease-out,
      background 0.2s ease-out;
    border-radius: 4px;

    svg {
      width: 16px;
      height: 16px;
    }

    &:hover {
      color: var(--grey-lighter);
      background: var(--grey-darkish);
    }

    &:disabled {
      color: var(--grey-dark);
      cursor: default;
    }
  }
`;

export const GraphExecutionSelectorBar: FC = () => {
  const nodes = useRecoilValue(nodesState);
  const [selectedExecutionByNode, setSelectedExecutionByNode] = useRecoilState(selectedProcessPageNodesState);
  const lastRunDataByNode = useRecoilValue(lastRunDataByNodeState);

  const nodeIds = useMemo(() => nodes.map((n) => n.id), [nodes]);

  const maxExecutionNum = useMemo(() => {
    return nodeIds.reduce((acc, nodeId) => {
      const processData = lastRunDataByNode[nodeId] ?? [];
      return processData.length > acc ? processData.length : acc;
    }, 0);
  }, [lastRunDataByNode, nodeIds]);

  const graphSelectedExecution = useMemo(() => {
    let selected: number | 'latest' | 'mixed' | undefined = undefined;

    for (const nodeId of nodeIds) {
      const page = selectedExecutionByNode[nodeId];
      if (selected === undefined) {
        selected = page;
      } else if (page !== selected) {
        return 'mixed';
      }
    }

    return selected === undefined ? 'latest' : selected;
  }, [selectedExecutionByNode, nodeIds]);

  const setAllSelectedExecution = (page: number | 'latest') => {
    setSelectedExecutionByNode((prev) =>
      produce(prev, (draft) => {
        for (const nodeId of nodeIds) {
          draft[nodeId] = page;
        }
      }),
    );
  };

  const onPrev = () => {
    if (graphSelectedExecution === 'latest' && maxExecutionNum > 1) {
      setAllSelectedExecution(maxExecutionNum - 1);
      return;
    } else if (graphSelectedExecution === 'latest') {
      return;
    }

    if (graphSelectedExecution === 'mixed') {
      setAllSelectedExecution(0);
      return;
    }

    if (graphSelectedExecution === 0) {
      return;
    }

    setAllSelectedExecution(graphSelectedExecution - 1);
  };

  const onNext = () => {
    if (graphSelectedExecution === 'latest' || graphSelectedExecution === 'mixed') {
      setAllSelectedExecution(maxExecutionNum - 1);
      return;
    }

    if (graphSelectedExecution === maxExecutionNum - 1) {
      return;
    }

    setAllSelectedExecution(graphSelectedExecution + 1);
  };

  const selectedExecutionText =
    graphSelectedExecution === 'latest'
      ? `${maxExecutionNum} / ${maxExecutionNum}`
      : graphSelectedExecution === 'mixed'
        ? '(Mixed)'
        : `${graphSelectedExecution + 1} / ${maxExecutionNum}`;

  if (maxExecutionNum <= 1) {
    return null;
  }

  return (
    <div css={styles}>
      <Tooltip content="Previous execution (all nodes)" placement="bottom">
        <button className="prev" onClick={onPrev}>
          <LeftIcon />
        </button>
      </Tooltip>
      <Tooltip
        content={`This graph has executed ${maxExecutionNum} times. You are viewing execution ${selectedExecutionText}.`}
        placement="bottom"
      >
        <div className="current">{selectedExecutionText}</div>
      </Tooltip>
      <Tooltip content="Next execution (all nodes)" placement="bottom">
        <button className="next" onClick={onNext}>
          <RightIcon />
        </button>
      </Tooltip>
    </div>
  );
};
