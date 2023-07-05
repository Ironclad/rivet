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
import { GraphId, NodeGraph, emptyNodeGraph } from '@ironclad/rivet-core';
import clsx from 'clsx';
import { LoadingSpinner } from './LoadingSpinner';
import { runningGraphsState } from '../state/dataFlow';
import { useDuplicateGraph } from '../hooks/useDuplicateGraph';
import { sidebarOpenState } from '../state/graphBuilder';
import { appWindow } from '@tauri-apps/api/window';
import Tabs, { Tab, TabList, TabPanel } from '@atlaskit/tabs';
import { useContextMenu } from '../hooks/useContextMenu';
import Portal from '@atlaskit/portal';
import { useStableCallback } from '../hooks/useStableCallback';

const styles = css`
  position: fixed;
  top: 32px; // Adjust this value based on the height of the MenuBar
  left: 0;
  bottom: 0;
  width: 250px; // Adjust the width of the sidebar as needed
  background-color: rgba(46, 46, 46, 0.35);
  padding: 0;
  z-index: 50;
  border-right: 1px solid var(--grey);
  height: calc(100vh - 32px);

  .panel {
    display: flex;
    flex-direction: column;
    width: 250px;
    margin: 0 -8px;
  }

  label {
    font-size: 12px;
  }

  .graph-info-section,
  .project-info-section {
    padding: 8px 12px;
  }

  .graphs-section {
    display: flex;
    flex-direction: column;
    flex-shrink: 1;
    min-height: 0;
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

  .tabs,
  .tabs > div {
    height: 100%;
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
  const [savedGraphs, setSavedGraphs] = useRecoilState(savedGraphsState);
  const [sidebarOpen, setSidebarOpen] = useRecoilState(sidebarOpenState);
  const runningGraphs = useRecoilValue(runningGraphsState);

  const sortedGraphs = orderBy(savedGraphs, ['metadata.name'], ['asc']);

  const deleteGraph = useDeleteGraph();
  const loadGraph = useLoadGraph();

  const loadedProject = useRecoilValue(loadedProjectState);

  const duplicateGraph = useDuplicateGraph();

  function handleNew() {
    const graph = emptyNodeGraph();
    loadGraph(graph);
    setSavedGraphs([...savedGraphs, graph]);
  }

  function setGraphAndSavedGraph(graph: NodeGraph) {
    setGraph(graph);
    setSavedGraphs(savedGraphs.map((g) => (g.metadata!.id === graph.metadata!.id ? graph : g)));
  }

  const { contextMenuRef, showContextMenu, contextMenuData, handleContextMenu } = useContextMenu();

  const selectedGraphForContextMenu = contextMenuData.data
    ? sortedGraphs.find((graph) => graph.metadata!.id === contextMenuData.data?.element.dataset.graphid)
    : null;

  useEffect(() => {
    (async () => {
      try {
        await appWindow.setTitle(`Rivet - ${project.metadata.title} (${loadedProject.path})`);
      } catch (err) {
        console.warn(`Failed to set window title, likely not running in Tauri: ${err}`);
      }
    })();
  }, [loadedProject, project.metadata.title]);

  const handleSidebarContextMenu = useStableCallback((e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.preventDefault();
    handleContextMenu(e);
  });

  return (
    <div
      ref={contextMenuRef}
      css={styles}
      style={{ transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.3s ease' }}
      onContextMenu={handleSidebarContextMenu}
    >
      <div className="toggle-tab" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? <ExpandLeftIcon /> : <ExpandRightIcon />}
      </div>
      <div className="tabs">
        <Tabs id="sidebar-tabs">
          <TabList>
            <Tab>Graphs</Tab>
            <Tab>Graph Info</Tab>
            <Tab>Project</Tab>
          </TabList>
          <TabPanel>
            <div className="panel" data-contextmenutype="graph-list">
              <div className="graphs-section">
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
              </div>
            </div>
          </TabPanel>
          <TabPanel>
            <div className="panel">
              <div className="graph-info-section">
                <InlineEditableTextfield
                  key={`graph-name-${graph.metadata?.id}`}
                  label="Graph Name"
                  placeholder="Graph Name"
                  onConfirm={(newValue) =>
                    setGraphAndSavedGraph({ ...graph, metadata: { ...graph.metadata, name: newValue } })
                  }
                  defaultValue={graph.metadata?.name ?? 'Untitled Graph'}
                  readViewFitContainerWidth
                />
                <InlineEditableTextfield
                  key={`graph-description-${graph.metadata?.id}`}
                  label="Description"
                  placeholder="Graph Description"
                  defaultValue={graph.metadata?.description ?? ''}
                  onConfirm={(newValue) =>
                    setGraphAndSavedGraph({ ...graph, metadata: { ...graph.metadata, description: newValue } })
                  }
                  readViewFitContainerWidth
                />
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
                  onConfirm={(newValue) =>
                    setProject({ ...project, metadata: { ...project.metadata, title: newValue } })
                  }
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
    </div>
  );
};
