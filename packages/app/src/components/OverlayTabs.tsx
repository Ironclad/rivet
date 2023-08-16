import { css } from '@emotion/react';
import { FC, useState } from 'react';

import { useRecoilState, useRecoilValue } from 'recoil';
import clsx from 'clsx';
import { trivetState } from '../state/trivet.js';
import { useRunMenuCommand } from '../hooks/useMenuCommands.js';
import { isInTauri } from '../utils/tauri.js';
import { LoadingSpinner } from './LoadingSpinner.js';
import { overlayOpenState } from '../state/ui';

const styles = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 100;
  position: absolute;
  top: 0;
  left: 300px;
  height: 32px;

  .left-menu {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    user-select: none;
  }

  .menu-item > button {
    background-color: transparent;
    color: var(--grey-lightest);
    border: none;
    padding: 0.5rem 1rem;
    cursor: pointer;

    border: 1px solid var(--grey);
    border-top: 0;

    border-radius: 0 0 8px 8px;
    background: var(--grey-darkerish);

    &:hover {
      background-color: var(--grey);
    }

    &.active {
      background-color: var(--primary);
      color: var(--foreground-on-primary);

      &:hover {
        background-color: var(--primary-light);
      }
    }
  }

  .dropdown-menu .dropdown-button {
    background-color: transparent;
    color: var(--grey-lightest);
    border: none;
    padding: 0.5rem 1rem;
    cursor: pointer;

    &:hover {
      background-color: var(--grey);
    }
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
      background-color: var(--tertiary-light);
      color: var(--primary-text);
    }
  }

  .dropdown-button {
    background-color: transparent;
    color: var(--grey-lightest);
    border: none;
    padding: 0.5rem 1rem;
    cursor: pointer;

    &:hover {
      background-color: var(--grey);
      color: var(--primary-text);
    }
  }

  .file-dropdown.open {
    display: block;
  }

  .remote-debugger {
    position: relative;
  }

  .trivet-menu button {
    display: flex;
    flex-direction: row;

    .spinner {
      margin-left: 4px;
    }

    &.active .spinner svg {
      color: var(--grey-dark);
    }
  }
`;

export const OverlayTabs: FC = () => {
  const [openOverlay, setOpenOverlay] = useRecoilState(overlayOpenState);
  const runMenuCommandImpl = useRunMenuCommand();
  const [fileMenuOpen, setFileMenuOpen] = useState(false);

  const trivet = useRecoilValue(trivetState);

  const runMenuCommand: typeof runMenuCommandImpl = (command) => {
    setFileMenuOpen(false);
    runMenuCommandImpl(command);
  };

  return (
    <div css={styles}>
      <div className="left-menu">
        {!isInTauri() && (
          <div className="menu-item file-menu">
            <button
              className="dropdown-button"
              onMouseDown={(e) => {
                if (e.button === 0) {
                  setFileMenuOpen((open) => !open);
                }
              }}
            >
              File
            </button>
            <div className={clsx('file-dropdown', { open: fileMenuOpen })}>
              <button onMouseUp={() => runMenuCommand('new_project')}>New Project</button>
              <button onMouseUp={() => runMenuCommand('open_project')}>Open Project...</button>
              <button onMouseUp={() => runMenuCommand('save_project_as')}>Save Project As...</button>
              <button onMouseUp={() => runMenuCommand('settings')}>Settings</button>
              <button onMouseUp={() => runMenuCommand('export_graph')}>Export Graph</button>
              <button onMouseUp={() => runMenuCommand('import_graph')}>Import Graph</button>
            </div>
          </div>
        )}

        <div className="menu-item prompt-designer-menu">
          <button
            className={clsx('dropdown-item', { active: openOverlay === 'promptDesigner' })}
            onMouseDown={(e) => {
              if (e.button === 0) {
                setOpenOverlay((s) => (s === 'promptDesigner' ? undefined : 'promptDesigner'));
              }
            }}
          >
            Prompt Designer
          </button>
        </div>
        <div className="menu-item trivet-menu">
          <button
            className={clsx('dropdown-item', { active: openOverlay === 'trivet' })}
            onMouseDown={(e) => {
              if (e.button === 0) {
                setOpenOverlay((s) => (s === 'trivet' ? undefined : 'trivet'));
              }
            }}
          >
            Trivet Tests
            {trivet.runningTests && (
              <div className="spinner">
                <LoadingSpinner />
              </div>
            )}
          </button>
        </div>
        <div className="menu-item chat-viewer-menu">
          <button
            className={clsx('dropdown-item', { active: openOverlay === 'chatViewer' })}
            onMouseDown={(e) => {
              if (e.button === 0) {
                setOpenOverlay((s) => (s === 'chatViewer' ? undefined : 'chatViewer'));
              }
            }}
          >
            Chat Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
