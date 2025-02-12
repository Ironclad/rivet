import { useWindowsHotkeysFix } from '../hooks/useWindowsHotkeysFix';
import { GraphBuilder } from './GraphBuilder.js';
import { OverlayTabs } from './OverlayTabs.js';
import { type FC, useEffect } from 'react';
import { css } from '@emotion/react';
import { SettingsModal } from './SettingsModal.js';
import { setGlobalTheme } from '@atlaskit/tokens';
import { LeftSidebar } from './LeftSidebar.js';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PromptDesignerRenderer } from './PromptDesigner.js';
import { useGraphExecutor } from '../hooks/useGraphExecutor.js';
import { useMenuCommands } from '../hooks/useMenuCommands.js';
import { TrivetRenderer } from './trivet/Trivet.js';
import { ActionBar } from './ActionBar';
import { DebuggerPanelRenderer } from './DebuggerConnectPanel';
import { ChatViewerRenderer } from './ChatViewer';
import { useAtomValue } from 'jotai';
import { themeState } from '../state/settings';
import clsx from 'clsx';
import { useLoadStaticData } from '../hooks/useLoadStaticData';
import { DataStudioRenderer } from './dataStudio/DataStudio';
import { StatusBar } from './StatusBar';
import { PluginsOverlayRenderer } from './PluginsOverlay';
import { useCheckForUpdate } from '../hooks/useCheckForUpdate';
import useAsyncEffect from 'use-async-effect';
import { UpdateModalRenderer } from './UpdateModal';
import { useMonitorUpdateStatus } from '../hooks/useMonitorUpdateStatus';
import { ProjectSelector } from './ProjectSelector';
import { NewProjectModalRenderer } from './NewProjectModal';
import { useWindowTitle } from '../hooks/useWindowTitle';
import { CommunityOverlayRenderer } from './community/CommunityOverlay';
import { HelpModal } from './HelpModal';
import { openedProjectsSortedIdsState } from '../state/savedGraphs';
import { NoProject } from './NoProject';
import { swallowPromise, syncWrapper } from '../utils/syncWrapper';
import { allInitializeStoreFns } from '../state/storage';

const styles = css`
  overflow: hidden;
`;

setGlobalTheme({
  colorMode: 'dark',
});

export const RivetApp: FC = () => {
  const { tryRunGraph, tryRunTests, tryAbortGraph, tryPauseGraph, tryResumeGraph } = useGraphExecutor();
  const theme = useAtomValue(themeState);
  const openedProjectIds = useAtomValue(openedProjectsSortedIdsState);

  const noProjectOpen = openedProjectIds.length === 0;

  useLoadStaticData();

  useMenuCommands({
    onRunGraph: syncWrapper(tryRunGraph),
  });

  useWindowsHotkeysFix();

  const checkForUpdate = useCheckForUpdate();

  useAsyncEffect(async () => {
    await checkForUpdate();
  }, []);

  useMonitorUpdateStatus();
  useWindowTitle();

  return (
    <div className={clsx('app', theme ? `theme-${theme}` : 'theme-default')} css={styles}>
      {noProjectOpen ? (
        <>
          <NoProject />
          <NewProjectModalRenderer />
          <SettingsModal />
        </>
      ) : (
        <>
          <ProjectSelector />
          <OverlayTabs />
          <ActionBar
            onRunGraph={syncWrapper(tryRunGraph)}
            onRunTests={syncWrapper(tryRunTests)}
            onAbortGraph={tryAbortGraph}
            onPauseGraph={tryPauseGraph}
            onResumeGraph={tryResumeGraph}
          />
          <StatusBar />
          <DebuggerPanelRenderer />
          <LeftSidebar onRunGraph={(graphId) => swallowPromise(tryRunGraph({ graphId }))} />
          <GraphBuilder />
          <SettingsModal />
          <PromptDesignerRenderer />
          <TrivetRenderer tryRunTests={tryRunTests} />
          <ChatViewerRenderer />
          <DataStudioRenderer />
          <PluginsOverlayRenderer />
          <UpdateModalRenderer />
          <NewProjectModalRenderer />
          <CommunityOverlayRenderer />
        </>
      )}
      <HelpModal />
      <ToastContainer enableMultiContainer position="bottom-right" hideProgressBar newestOnTop />
      <ToastContainer
        enableMultiContainer
        containerId="wide"
        style={{ width: 600 }}
        position="bottom-right"
        hideProgressBar
        newestOnTop
      />
    </div>
  );
};
