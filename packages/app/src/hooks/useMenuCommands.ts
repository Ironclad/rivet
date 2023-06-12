import { useEffect } from 'react';
import { useSaveProject } from './useSaveProject';
import { window } from '@tauri-apps/api';
import { match } from 'ts-pattern';
import { useNewProject } from './useNewProject';
import { useLoadProject } from './useLoadProject';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { settingsModalOpenState } from '../components/SettingsModal';
import { loadGraphData, saveGraphData } from '../utils/fileIO';
import { graphState } from '../state/graph';

type MenuIds =
  | 'settings'
  | 'quit'
  | 'new_project'
  | 'open_project'
  | 'save_project'
  | 'save_project_as'
  | 'export_graph'
  | 'import_graph'
  | 'run';

const handlerState: {
  handler: (e: { payload: MenuIds }) => void;
} = { handler: () => {} };

const mainWindow = window.getCurrent();
mainWindow.onMenuClicked((e) => {
  handlerState.handler(e as { payload: MenuIds });
});

export function useMenuCommands(
  options: {
    onRunGraph?: () => void;
  } = {},
) {
  const [graphData, setGraphData] = useRecoilState(graphState);
  const { saveProject, saveProjectAs } = useSaveProject();
  const newProject = useNewProject();
  const loadProject = useLoadProject();
  const setSettingsOpen = useSetRecoilState(settingsModalOpenState);

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
          saveGraphData(graphData);
        })
        .with('import_graph', () => {
          loadGraphData((data) => setGraphData(data));
        })
        .with('run', () => {
          options.onRunGraph?.();
        })
        .exhaustive();
    };

    const prevHandler = handlerState.handler;
    handlerState.handler = handler;

    return () => {
      handlerState.handler = prevHandler;
    };
  }, [saveProject, saveProjectAs, newProject, loadProject, setSettingsOpen, graphData, setGraphData, options]);
}
