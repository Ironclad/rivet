import { GraphBuilder } from './GraphBuilder.js';
import { OverlayTabs } from './OverlayTabs.js';
import { FC } from 'react';
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
import { useRecoilValue } from 'recoil';
import { themeState } from '../state/settings';
import clsx from 'clsx';

const styles = css`
  overflow: hidden;
`;

setGlobalTheme({
  colorMode: 'dark',
});

export const RivetApp: FC = () => {
  const { tryRunGraph, tryRunTests, tryAbortGraph, tryPauseGraph, tryResumeGraph } = useGraphExecutor();
  const theme = useRecoilValue(themeState);

  useMenuCommands({
    onRunGraph: tryRunGraph,
  });

  return (
    <div className={clsx('app', theme ? `theme-${theme}` : 'theme-default')} css={styles}>
      <OverlayTabs />
      <ActionBar
        onRunGraph={tryRunGraph}
        onRunTests={tryRunTests}
        onAbortGraph={tryAbortGraph}
        onPauseGraph={tryPauseGraph}
        onResumeGraph={tryResumeGraph}
      />
      <DebuggerPanelRenderer />
      <LeftSidebar />
      <GraphBuilder />
      <SettingsModal />
      <PromptDesignerRenderer />
      <TrivetRenderer tryRunTests={tryRunTests} />
      <ChatViewerRenderer />
      <ToastContainer position="bottom-right" hideProgressBar newestOnTop />
    </div>
  );
};
