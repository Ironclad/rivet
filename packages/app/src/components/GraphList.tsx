import { css } from '@emotion/react';
import { FC } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { graphState } from '../state/graph';
import { savedGraphsState } from '../state/savedGraphs';
import { orderBy } from 'lodash-es';
import { nanoid } from 'nanoid';
import { DropdownItem } from '@atlaskit/dropdown-menu';
import { useDeleteGraph } from '../hooks/useDeleteGraph';
import { useLoadGraph } from '../hooks/useLoadGraph';
import { GraphId, emptyNodeGraph } from '@ironclad/rivet-core';
import clsx from 'clsx';
import { LoadingSpinner } from './LoadingSpinner';
import { runningGraphsState } from '../state/dataFlow';
import { useDuplicateGraph } from '../hooks/useDuplicateGraph';
import { useContextMenu } from '../hooks/useContextMenu';
import Portal from '@atlaskit/portal';

const styles = css`
  display: flex;
  flex-direction: column;
  flex-shrink: 1;
  min-height: 100%;
  margin-top: 8px;

  .graph-list {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-height: 0;
    overflow: auto;
    flex-shrink: 1;
    margin-top: 8px;
  }

  .graph-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    user-select: none;
    padding: 0 4px;
    font-size: 12px;

    &:hover {
      background-color: var(--grey-darkish);
    }
  }

  .graph-item-select {
    cursor: pointer;
    padding: 4px 8px;
    flex: 1;
  }

  .selected {
    background-color: var(--primary);
    color: var(--grey-dark);

    &:hover {
      background-color: var(--primary-dark);
    }
  }

  .spinner {
    position: absolute;
    right: 32px;
    width: 16px;
    padding-left: 4px;
  }

  .selected .spinner svg {
    color: var(--grey-dark);
  }
`;

const contextMenuStyles = css`
  position: absolute;
  border: 1px solid var(--grey);
  box-shadow: 0 3px 5px rgba(0, 0, 0, 0.2);
  background: var(--grey-dark);
  min-width: max-content;
`;


export const GraphList: FC = () => {
  const graph = useRecoilValue(graphState);
  const [savedGraphs, setSavedGraphs] = useRecoilState(savedGraphsState);
  const sortedGraphs = orderBy(savedGraphs, ['metadata.name'], ['asc']);
  const runningGraphs = useRecoilValue(runningGraphsState);

  const deleteGraph = useDeleteGraph();
  const loadGraph = useLoadGraph();

  const duplicateGraph = useDuplicateGraph();

  function handleNew() {
    const graph = emptyNodeGraph();
    loadGraph(graph);
    setSavedGraphs([...savedGraphs, graph]);
  }

  const { contextMenuRef, showContextMenu, contextMenuData, handleContextMenu } = useContextMenu();

  const selectedGraphForContextMenu = contextMenuData.data
    ? savedGraphs.find((graph) => graph.metadata!.id === contextMenuData.data?.element.dataset.graphid)
    : null;

  return <div css={styles} ref={contextMenuRef} onContextMenu={handleContextMenu}>
    <div className="graph-list">
      {sortedGraphs.map((savedGraph) => {
        const graphIsRunning = runningGraphs.includes(savedGraph.metadata?.id ?? ('' as GraphId));
        return (
          <div
            key={savedGraph.metadata?.id ?? nanoid()}
            className={clsx('graph-item', { selected: graph.metadata?.id === savedGraph.metadata?.id })}
            data-contextmenutype="graph-item"
            data-graphid={savedGraph.metadata?.id}
          >
            <div className="spinner">{graphIsRunning && <LoadingSpinner />}</div>
            <div className="graph-item-select" onClick={() => loadGraph(savedGraph)}>
              {savedGraph.metadata?.name ?? 'Untitled Graph'}
            </div>
          </div>
        );
      })}
      <Portal>
        {showContextMenu && contextMenuData.data?.type === 'graph-item' && (
          <div
            className="graph-item-context-menu"
            css={contextMenuStyles}
            style={{
              zIndex: 500,
              left: contextMenuData.x,
              top: contextMenuData.y,
            }}
          >
            <DropdownItem onClick={() => duplicateGraph(selectedGraphForContextMenu!)}>
              Duplicate
            </DropdownItem>
            <DropdownItem onClick={() => deleteGraph(selectedGraphForContextMenu!)}>Delete</DropdownItem>
          </div>
        )}
      </Portal>
    </div>
    <Portal>
      {showContextMenu && contextMenuData.data?.type === 'graph-list' && (
        <div
          className="graph-list-context-menu"
          css={contextMenuStyles}
          style={{
            zIndex: 500,
            left: contextMenuData.x,
            top: contextMenuData.y,
          }}
        >
          <DropdownItem onClick={handleNew}>New Graph</DropdownItem>
        </div>
      )}
    </Portal>
  </div>;
}