import { css } from '@emotion/react';
import { FC, useEffect } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { graphState } from '../state/graph';
import { loadedProjectState, projectState, savedGraphsState } from '../state/savedGraphs';
import { orderBy } from 'lodash-es';
import { nanoid } from 'nanoid';
import { DropdownItem } from '@atlaskit/dropdown-menu';
import { ReactComponent as ExpandLeftIcon } from 'majesticons/line/menu-expand-left-line.svg';
import { ReactComponent as ExpandRightIcon } from 'majesticons/line/menu-expand-right-line.svg';
import { InlineEditableTextfield } from '@atlaskit/inline-edit';
import { useDeleteGraph } from '../hooks/useDeleteGraph';
import { useLoadGraph } from '../hooks/useLoadGraph';
import { GraphId, emptyNodeGraph } from '@ironclad/rivet-core';
import clsx from 'clsx';
import { LoadingSpinner } from './LoadingSpinner';
import { runningGraphsState } from '../state/dataFlow';
import { useDuplicateGraph } from '../hooks/useDuplicateGraph';
import { sidebarOpenState } from '../state/graphBuilder';
import { appWindow } from '@tauri-apps/api/window';
import Tabs, { Tab, TabList, TabPanel } from '@atlaskit/tabs';
import { Label } from '@atlaskit/form';
import { useContextMenu } from '../hooks/useContextMenu';
import Portal from '@atlaskit/portal';

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
  height: calc(100vh - 32px);

  .panel {
    display: flex;
    flex-direction: column;
    width: 300px;
    margin: 0 -8px;
  }

  label {
    font-size: 12px;
  }

  .graph-info-section {
    padding: 8px 12px;
    background-color: #2a2a2a;
    border-bottom: 1px solid var(--grey);
    box-shadow: 0 3px 5px rgba(0, 0, 0, 0.2);
  }

  .graphs-section {
    display: flex;
    flex-direction: column;
    flex-shrink: 1;
    min-height: 0;
    background-color: var(--grey-dark);
    margin-top: 8px;
  }

  .graph-list {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-height: 0;
    overflow: auto;
    flex-shrink: 1;
  }

  .graph-item {
    background-color: var(--grey-dark);
    display: flex;
    justify-content: space-between;
    align-items: center;
    user-select: none;
    padding: 0 4px;

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
    padding: 0 4px 0 12px;
    user-select: none;

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

  .project-info-section {
    padding: 8px 12px;
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

const contextMenuStyles = css`
  position: absolute;
  border: 1px solid var(--grey);
  box-shadow: 0 3px 5px rgba(0, 0, 0, 0.2);
  background: var(--grey-dark);
  min-width: max-content;
`;

export const LeftSidebar: FC = () => {
  const [graph, setGraph] = useRecoilState(graphState);
  const [project, setProject] = useRecoilState(projectState);
  const savedGraphs = useRecoilValue(savedGraphsState);
  const [sidebarOpen, setSidebarOpen] = useRecoilState(sidebarOpenState);
  const runningGraphs = useRecoilValue(runningGraphsState);

  const sortedGraphs = orderBy(savedGraphs, ['metadata.name'], ['asc']);

  const deleteGraph = useDeleteGraph();
  const loadGraph = useLoadGraph();

  const loadedProject = useRecoilValue(loadedProjectState);

  const duplicateGraph = useDuplicateGraph();

  function handleNew() {
    loadGraph(emptyNodeGraph());
  }

  const {
    contextMenuRef,
    showContextMenu,
    contextMenuData,
    handleContextMenu,
    setContextMenuData,
    setShowContextMenu,
  } = useContextMenu();

  const selectedGraphForContextMenu = contextMenuData.data
    ? sortedGraphs.find((graph) => graph.metadata!.id === contextMenuData.data?.element.dataset.graphid)
    : null;

  useEffect(() => {
    appWindow.setTitle(`Rivet - ${project.metadata.title} (${loadedProject.path})`);
  }, [loadedProject, project.metadata.title]);

  return (
    <div
      css={styles}
      style={{ transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.3s ease' }}
    >
      <div className="toggle-tab" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? <ExpandLeftIcon /> : <ExpandRightIcon />}
      </div>
      <Tabs id="sidebar-tabs">
        <TabList>
          <Tab>Graphs</Tab>
          <Tab>Project</Tab>
        </TabList>
        <TabPanel>
          <div className="panel">
            <div className="graph-info-section">
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
                <Label htmlFor="">Graphs</Label>
                <button className="new-graph" onClick={handleNew}>
                  New
                </button>
              </div>
              <div className="graph-list" ref={contextMenuRef}>
                {sortedGraphs.map((savedGraph) => {
                  const graphIsRunning = runningGraphs.includes(savedGraph.metadata?.id ?? ('' as GraphId));
                  return (
                    <div
                      key={savedGraph.metadata?.id ?? nanoid()}
                      className={clsx('graph-item', { selected: graph.metadata?.id === savedGraph.metadata?.id })}
                      onContextMenu={handleContextMenu}
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
                  {showContextMenu && (
                    <div
                      className="graph-list-context-menu"
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
            </div>
          </div>
        </TabPanel>
        <TabPanel>
          <div className="panel">
            <div className="project-info-section">
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
                onConfirm={(newValue) =>
                  setProject({ ...project, metadata: { ...project.metadata, description: newValue } })
                }
                readViewFitContainerWidth
              />
            </div>
          </div>
        </TabPanel>
      </Tabs>
    </div>
  );
};
