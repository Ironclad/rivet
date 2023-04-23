import { css } from '@emotion/react';
import { FC, useState } from 'react';
import { InlineEditableTextArea } from './InlineEditableTextArea';
import { useRecoilState } from 'recoil';
import { graphState } from '../state/graph';
import { savedGraphsState } from '../state/savedGraphs';
import { orderBy } from 'lodash-es';
import { nanoid } from 'nanoid';
import { NodeGraph, emptyNodeGraph } from '../model/NodeGraph';
import { useSaveCurrentGraph } from '../hooks/useSaveCurrentGraph';
import DropdownMenu, { DropdownItem } from '@atlaskit/dropdown-menu';
import Button from '@atlaskit/button';
import { ReactComponent as MoreIcon } from 'majesticons/line/more-menu-vertical-line.svg';
import { ReactComponent as ExpandLeftIcon } from 'majesticons/line/menu-expand-left-line.svg';
import { ReactComponent as ExpandRightIcon } from 'majesticons/line/menu-expand-right-line.svg';

const styles = css`
  position: fixed;
  top: 32px; // Adjust this value based on the height of the MenuBar
  left: 0;
  bottom: 0;
  width: 300px; // Adjust the width of the sidebar as needed
  background-color: var(--grey-dark);
  padding: 1rem;
  z-index: 50;
  border-right: 1px solid var(--grey);

  label {
    font-size: 12px;
  }

  .graphs-section {
    margin-top: 2rem;
  }

  .graph-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .graph-item {
    background-color: var(--grey-dark);
    display: flex;
    justify-content: space-between;
    align-items: center;

    &:hover {
      background-color: var(--grey-darkish);
    }
  }

  .graph-item-select {
    cursor: pointer;
    padding: 4px 8px;
    flex: 1;
  }

  .toggle-tab {
    position: absolute;
    top: 10px;
    right: -32px;
    background-color: var(--grey-dark);
    border: 1px solid var(--grey);
    border-left: 0;
    border-radius: 0 8px 8px 0;
    width: 32px;
    height: 32px;
    font-size: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 100;
  }

  .toggle-tab:hover {
    background-color: var(--grey-darkish);
  }
`;

const moreDropdownCss = css`
  span {
    font-size: 32px;
  }
`;

export const LeftSidebar: FC = () => {
  const [graph, setGraph] = useRecoilState(graphState);
  const [savedGraphs, setSavedGraphs] = useRecoilState(savedGraphsState);
  const saveCurrentGraph = useSaveCurrentGraph();
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const sortedGraphs = orderBy(savedGraphs, ['metadata.name'], ['asc']);

  function handleGraphItemClick(savedGraph: NodeGraph) {
    if (graph.nodes.length > 0 || graph.metadata?.name !== emptyNodeGraph().metadata!.name) {
      saveCurrentGraph();
    }

    setGraph(savedGraph);
  }

  function handleDeleteGraph(savedGraph: NodeGraph) {
    if (savedGraph.metadata?.id) {
      const newSavedGraphs = savedGraphs.filter((g) => g.metadata?.id !== savedGraph.metadata?.id);
      setGraph(emptyNodeGraph());
      setSavedGraphs(newSavedGraphs);
    }
  }

  return (
    <div
      css={styles}
      style={{ transform: isSidebarVisible ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.3s ease' }}
    >
      <div className="toggle-tab" onClick={() => setIsSidebarVisible(!isSidebarVisible)}>
        {isSidebarVisible ? <ExpandLeftIcon /> : <ExpandRightIcon />}
      </div>
      <div className="graph-info-section">
        <label>Graph Name</label>
        <InlineEditableTextArea
          placeholder="Graph Name"
          value={graph.metadata?.name ?? 'Untitled Graph'}
          onChange={(newValue) => setGraph({ ...graph, metadata: { ...graph.metadata, name: newValue } })}
        />

        <label>Description</label>
        <InlineEditableTextArea
          placeholder="Graph Description"
          value={graph.metadata?.description ?? ''}
          onChange={(newValue) => setGraph({ ...graph, metadata: { ...graph.metadata, description: newValue } })}
        />
      </div>
      <div className="graphs-section">
        <label>Graphs</label>
        <div className="graph-list">
          {sortedGraphs.map((savedGraph) => (
            <div key={savedGraph.metadata?.id ?? nanoid()} className="graph-item">
              <div className="graph-item-select" onClick={() => handleGraphItemClick(savedGraph)}>
                {savedGraph.metadata?.name ?? 'Untitled Graph'}
              </div>
              <DropdownMenu
                trigger={({ triggerRef, ...props }) => (
                  <Button css={moreDropdownCss} {...props} iconBefore={<MoreIcon />} ref={triggerRef} />
                )}
              >
                <DropdownItem onClick={() => handleDeleteGraph(savedGraph)}>Delete</DropdownItem>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
