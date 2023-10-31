import { useEffect } from 'react';
import { useSaveProject } from './useSaveProject.js';
import { window } from '@tauri-apps/api';
import { match } from 'ts-pattern';
import { useNewProject } from './useNewProject.js';
import { useLoadProjectWithFileBrowser } from './useLoadProjectWithFileBrowser.js';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { settingsModalOpenState } from '../components/SettingsModal.js';
import { graphState } from '../state/graph.js';
import { useLoadRecording } from './useLoadRecording.js';
import { type WebviewWindow } from '@tauri-apps/api/window';
import { ioProvider } from '../utils/globals.js';
import { debuggerPanelOpenState } from '../state/ui';
import { useToggleRemoteDebugger } from '../components/DebuggerConnectPanel';
import { lastRunDataByNodeState } from '../state/dataFlow';
import { useImportGraph } from './useImportGraph';

type MenuIds =
  | 'settings'
  | 'quit'
  | 'new_project'
  | 'open_project'
  | 'save_project'
  | 'save_project_as'
  | 'export_graph'
  | 'import_graph'
  | 'run'
  | 'load_recording'
  | 'remote_debugger'
  | 'toggle_devtools'
  | 'clear_outputs';

const handlerState: {
  handler: (e: { payload: MenuIds }) => void;
} = { handler: () => {} };

let mainWindow: WebviewWindow;

try {
  mainWindow = window.getCurrent();
  mainWindow.onMenuClicked((e) => {
    handlerState.handler(e as { payload: MenuIds });
  });
} catch (err) {
  console.warn(`Error getting main window, likely not running in tauri: ${err}`);
}

export function useRunMenuCommand() {
  return (command: MenuIds) => {
    const { handler } = handlerState;

    handler({ payload: command });
  };
}

export function useMenuCommands(
  options: {
    onRunGraph?: () => void;
  } = {},
) {
  const [graphData, setGraphData] = useRecoilState(graphState);
  const { saveProject, saveProjectAs } = useSaveProject();
  const newProject = useNewProject();
  const loadProject = useLoadProjectWithFileBrowser();
  const setSettingsOpen = useSetRecoilState(settingsModalOpenState);
  const { loadRecording } = useLoadRecording();
  const toggleRemoteDebugger = useToggleRemoteDebugger();
  const setLastRunData = useSetRecoilState(lastRunDataByNodeState);
  const importGraph = useImportGraph();

  useEffect(() => {
    const handler: (e: { payload: MenuIds }) => void = ({ payload }) => {
      match(payload as MenuIds)
        .with('settings', () => {
          setSettingsOpen(true);
        })
        .with('quit', () => {
          mainWindow.close();
        })
        .with('new_project', () => {
          newProject();
        })
        .with('open_project', () => {
          loadProject();
        })
        .with('save_project', () => {
          saveProject();
        })
        .with('save_project_as', () => {
          saveProjectAs();
        })
        .with('export_graph', () => {
          ioProvider.saveGraphData(graphData);
        })
        .with('import_graph', () => {
          importGraph();
        })
        .with('run', () => {
          options.onRunGraph?.();
        })
        .with('load_recording', () => {
          loadRecording();
        })
        .with('remote_debugger', () => {
          toggleRemoteDebugger();
        })
        .with('toggle_devtools', () => {})
        .with('clear_outputs', () => {
          setLastRunData({});
        })
        .exhaustive();
    };

    const prevHandler = handlerState.handler;
    handlerState.handler = handler;

    return () => {
      handlerState.handler = prevHandler;
    };
  }, [
    saveProject,
    saveProjectAs,
    newProject,
    loadProject,
    setSettingsOpen,
    graphData,
    setGraphData,
    options,
    loadRecording,
  ]);
}
