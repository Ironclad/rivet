import { GraphBuilder } from './GraphBuilder.js';
import { MenuBar } from './MenuBar.js';
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

const styles = css`
  overflow: hidden;
`;

setGlobalTheme({
  colorMode: 'dark',
});

export const RivetApp: FC = () => {
  const { tryRunGraph, tryRunTests, tryAbortGraph, tryPauseGraph, tryResumeGraph } = useGraphExecutor();

  useMenuCommands({
    onRunGraph: tryRunGraph,
  });

  return (
    <div className="app" css={styles}>
      <MenuBar />
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
      <ToastContainer position="bottom-right" hideProgressBar newestOnTop />
    </div>
  );
};
