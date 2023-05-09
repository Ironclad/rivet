import { css } from '@emotion/react';
import { FC, useState } from 'react';
import { ReactComponent as ChevronRightIcon } from 'majesticons/line/chevron-right-line.svg';
import { ReactComponent as MultiplyIcon } from 'majesticons/line/multiply-line.svg';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { settingsModalOpenState } from './SettingsModal';
import { loadGraphData, loadProjectData, saveGraphData, saveProjectData } from '../utils/fileIO';
import { graphState } from '../state/graph';
import { emptyNodeGraph } from '../model/NodeGraph';
import { useSaveCurrentGraph } from '../hooks/useSaveCurrentGraph';
import { graphRunningState } from '../state/dataFlow';
import clsx from 'clsx';
import { useLoadGraph } from '../hooks/useLoadGraph';
import { projectState } from '../state/savedGraphs';
import { nanoid } from 'nanoid';
import { Project, ProjectId } from '../model/Project';
import { set } from 'immer/dist/internal.js';

const styles = css`
  display: flex;
  justify-content: space-between;
  align-items: center;

  background-color: #2b2b2b;
  border-bottom: 1px solid var(--grey);
  z-index: 100;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 32px;

  .left-menu {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .menu-item > button {
    background-color: transparent;
    color: #ffffff;
    border: none;
    padding: 0.5rem 1rem;
    cursor: pointer;

    &:hover {
      background-color: var(--grey);
    }
  }

  .dropdown-menu .dropdown-button {
    background-color: transparent;
    color: #ffffff;
    border: none;
    padding: 0.5rem 1rem;
    cursor: pointer;

    &:hover {
      background-color: var(--grey);
    }
  }

  .run-button button {
    background-color: var(--success);
    color: #ffffff;
    border: none;
    padding: 0.5rem 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    &:hover {
      background-color: var(--success-dark);
    }
  }

  .run-button.running button {
    background-color: var(--error);
  }

  .file-menu {
    position: relative;
  }

  .file-dropdown {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    background-color: var(--grey-darkest);
    border: 2px solid var(--grey-darkish);
    border-radius: 4px;
    box-shadow: 0 8px 16px var(--shadow-dark);
    font-family: 'Roboto Mono', monospace;
    color: var(--foreground);
    font-size: 13px;
    padding: 8px;
    z-index: 1;
    min-width: 150px;
    user-select: none;
  }

  .file-dropdown button {
    display: flex;
    align-items: center;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    padding: 4px 8px;
    white-space: nowrap;
    background: transparent;
    border: 0;
    display: block;
    width: 100%;
    justify-content: flex-start;
    text-align: left;
    font-size: 14px;
    transition: background-color 0.1s ease-out, color 0.1s ease-out;

    &:hover {
      background-color: #4444446e;
      color: var(--primary);
    }
  }

  .dropdown-button {
    background-color: transparent;
    color: #ffffff;
    border: none;
    padding: 0.5rem 1rem;
    cursor: pointer;

    &:hover {
      background-color: var(--grey);
      color: var(--primary);
    }
  }

  .file-dropdown.open {
    display: block;
  }
`;

export type MenuBarProps = {
  onRunGraph?: () => void;
  onAbortGraph?: () => void;
};

export const MenuBar: FC<MenuBarProps> = ({ onRunGraph, onAbortGraph }) => {
  const setSettingsOpen = useSetRecoilState(settingsModalOpenState);
  const [graphData, setGraphData] = useRecoilState(graphState);
  const [project, setProject] = useRecoilState(projectState);
  const [fileMenuOpen, setFileMenuOpen] = useState(false);

  const graphRunning = useRecoilValue(graphRunningState);

  function handleNewProject() {
    setProject({
      graphs: {},
      metadata: {
        id: nanoid() as ProjectId,
        title: 'Untitled Project',
        description: '',
      },
    });
    setGraphData(emptyNodeGraph());
    setFileMenuOpen(false);
  }

  function handleLoadProject() {
    loadProjectData((project) => {
      setProject(project);
      setGraphData(emptyNodeGraph());
    });
    setFileMenuOpen(false);
  }

  function handleSaveProject() {
    saveProjectData(project);
    setFileMenuOpen(false);
  }

  return (
    <div css={styles}>
      <div className="left-menu">
        <div className="menu-item file-menu">
          <button className="dropdown-button" onClick={() => setFileMenuOpen((open) => !open)}>
            File
          </button>
          <div className={clsx('file-dropdown', { open: fileMenuOpen })}>
            <button onClick={handleNewProject}>New Project</button>
            <button onClick={handleLoadProject}>Open Project</button>
            <button onClick={handleSaveProject}>Save Project</button>
          </div>
        </div>
        <div className="menu-item settings-button">
          <button onClick={() => setSettingsOpen(true)}>Settings</button>
        </div>
        <div className="menu-item export-button">
          <button onClick={() => saveGraphData(graphData)}>Export Graph</button>
        </div>
        <div className="menu-item import-button">
          <button onClick={() => loadGraphData((data) => setGraphData(data))}>Import</button>
        </div>
      </div>
      <div className={clsx('run-button', { running: graphRunning })}>
        <button onClick={graphRunning ? onAbortGraph : onRunGraph}>
          {graphRunning ? (
            <>
              Abort <MultiplyIcon />
            </>
          ) : (
            <>
              Run <ChevronRightIcon />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
