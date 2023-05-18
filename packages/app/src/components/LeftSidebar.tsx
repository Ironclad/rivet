import { css } from '@emotion/react';
import { FC, useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { graphState } from '../state/graph';
import { loadedProjectState, projectState, savedGraphsState } from '../state/savedGraphs';
import { orderBy } from 'lodash-es';
import { nanoid } from 'nanoid';
import DropdownMenu, { DropdownItem } from '@atlaskit/dropdown-menu';
import Button from '@atlaskit/button';
import { ReactComponent as MoreIcon } from 'majesticons/line/more-menu-vertical-line.svg';
import { ReactComponent as ExpandLeftIcon } from 'majesticons/line/menu-expand-left-line.svg';
import { ReactComponent as ExpandRightIcon } from 'majesticons/line/menu-expand-right-line.svg';
import { InlineEditableTextfield } from '@atlaskit/inline-edit';
import { useDeleteGraph } from '../hooks/useDeleteGraph';
import { useLoadGraph } from '../hooks/useLoadGraph';
import { GraphId, emptyNodeGraph } from '@ironclad/nodai-core';
import clsx from 'clsx';
import { useSaveCurrentGraph } from '../hooks/useSaveCurrentGraph';
import { useSaveProject } from '../hooks/useSaveProject';
import { LoadingSpinner } from './LoadingSpinner';
import { runningGraphsState } from '../state/dataFlow';
import { useDuplicateGraph } from '../hooks/useDuplicateGraph';

const styles = css`
  position: fixed;
  top: 32px; // Adjust this value based on the height of the MenuBar
  left: 0;
  bottom: 0;
  width: 300px; // Adjust the width of the sidebar as needed
  background-color: var(--grey-dark);
  padding: 0;
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

  .graphs-section-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    align-items: center;
    padding: 0 12px;

    button {
      padding: 4px 8px;
      border-radius: 4px;
      background-color: var(--grey-dark);
      border: 1px solid var(--grey);
      cursor: pointer;

      &:hover {
        background-color: var(--grey-darkish);
      }
    }
  }

  .selected {
    background-color: var(--primary);
    color: var(--grey-dark);

    &:hover {
      background-color: var(--primary-dark);
    }
  }

  .save-graph,
  .save-project {
    padding: 4px 8px;
    border-radius: 4px;
    background-color: var(--grey-dark);
    border: 1px solid var(--grey);
    cursor: pointer;

    &:hover {
      background-color: var(--grey-darkish);
    }
  }

  .graph-info-section {
    padding: 8px 12px;
  }

  .project-info-section {
    background-color: var(--grey-darker);
    padding: 8px 12px;
  }

  .spinner {
    width: 16px;
    padding-left: 4px;
  }

  .selected .spinner svg {
    color: var(--grey-dark);
  }

  .loaded-project {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
`;

const moreDropdownCss = css`
  span {
    font-size: 32px;
  }

  &.selected {
    background-color: var(--primary-dark);
    color: var(--grey-dark) !important;

    &:hover {
      background-color: var(--primary);
    }
  }
`;

export const LeftSidebar: FC = () => {
  const [graph, setGraph] = useRecoilState(graphState);
  const [project, setProject] = useRecoilState(projectState);
  const savedGraphs = useRecoilValue(savedGraphsState);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const runningGraphs = useRecoilValue(runningGraphsState);

  const sortedGraphs = orderBy(savedGraphs, ['metadata.name'], ['asc']);

  const deleteGraph = useDeleteGraph();
  const loadGraph = useLoadGraph();
  const saveGraph = useSaveCurrentGraph();
  const { saveProject } = useSaveProject();

  const loadedProject = useRecoilValue(loadedProjectState);

  const duplicateGraph = useDuplicateGraph();

  function handleNew() {
    loadGraph(emptyNodeGraph());
  }

  return (
    <div
      css={styles}
      style={{ transform: isSidebarVisible ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.3s ease' }}
    >
      <div className="toggle-tab" onClick={() => setIsSidebarVisible(!isSidebarVisible)}>
        {isSidebarVisible ? <ExpandLeftIcon /> : <ExpandRightIcon />}
      </div>
      <div className="project-info-section">
        <div className="loaded-project">
          {loadedProject.loaded && <div>Loaded: {loadedProject.path.split('/').pop()}</div>}
          <button className="save-project" onClick={saveProject}>
            Save Project
          </button>
        </div>
        <InlineEditableTextfield
          key={`name-${project.metadata.id}`}
          label="Project Name"
          placeholder="Project Name"
          readViewFitContainerWidth
          defaultValue={project.metadata.title}
          onConfirm={(newValue) => setProject({ ...project, metadata: { ...project.metadata, title: newValue } })}
        />

        <InlineEditableTextfield
          key={`description-${project.metadata.id}`}
          label="Description"
          placeholder="Project Description"
          defaultValue={project.metadata?.description ?? ''}
          onConfirm={(newValue) => setProject({ ...project, metadata: { ...project.metadata, description: newValue } })}
          readViewFitContainerWidth
        />
      </div>
      <div className="graph-info-section">
        <button className="save-graph" onClick={saveGraph}>
          Save Graph
        </button>
        <InlineEditableTextfield
          key={`graph-name-${graph.metadata?.id}`}
          label="Graph Name"
          placeholder="Graph Name"
          onConfirm={(newValue) => setGraph({ ...graph, metadata: { ...graph.metadata, name: newValue } })}
          defaultValue={graph.metadata?.name ?? 'Untitled Graph'}
          readViewFitContainerWidth
        />
        <InlineEditableTextfield
          key={`graph-description-${graph.metadata?.id}`}
          label="Description"
          placeholder="Graph Description"
          defaultValue={graph.metadata?.description ?? ''}
          onConfirm={(newValue) => setGraph({ ...graph, metadata: { ...graph.metadata, description: newValue } })}
          readViewFitContainerWidth
        />
      </div>
      <div className="graphs-section">
        <div className="graphs-section-header">
          <label>Graphs</label>
          <button className="new-graph" onClick={handleNew}>
            New
          </button>
        </div>
        <div className="graph-list">
          {sortedGraphs.map((savedGraph) => {
            const graphIsRunning = runningGraphs.includes(savedGraph.metadata?.id ?? ('' as GraphId));
            return (
              <div
                key={savedGraph.metadata?.id ?? nanoid()}
                className={clsx('graph-item', { selected: graph.metadata?.id === savedGraph.metadata?.id })}
              >
                <div className="spinner">{graphIsRunning && <LoadingSpinner />}</div>
                <div className="graph-item-select" onClick={() => loadGraph(savedGraph)}>
                  {savedGraph.metadata?.name ?? 'Untitled Graph'}
                </div>
                <DropdownMenu
                  trigger={({ triggerRef, ...props }) => (
                    <Button
                      css={moreDropdownCss}
                      className={clsx({ selected: graph.metadata?.id === savedGraph.metadata?.id })}
                      {...props}
                      iconBefore={<MoreIcon />}
                      ref={triggerRef}
                    />
                  )}
                >
                  <DropdownItem onClick={() => duplicateGraph(savedGraph)}>Duplicate</DropdownItem>
                  <DropdownItem onClick={() => deleteGraph(savedGraph)}>Delete</DropdownItem>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
