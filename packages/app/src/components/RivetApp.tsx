import { GraphBuilder } from './GraphBuilder';
import { MenuBar } from './MenuBar';
import { FC } from 'react';
import { css } from '@emotion/react';
import { SettingsModal } from './SettingsModal';
import { setGlobalTheme } from '@atlaskit/tokens';
import { LeftSidebar } from './LeftSidebar';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PromptDesignerRenderer } from './PromptDesigner';
import { useGraphExecutor } from '../hooks/useGraphExecutor';
import { useMenuCommands } from '../hooks/useMenuCommands';
import { GraphTesterRenderer } from './GraphTester';

const styles = css`
  overflow: hidden;
`;

setGlobalTheme({
  colorMode: 'dark',
});

export const RivetApp: FC = () => {
  const { tryRunGraph, tryAbortGraph, tryPauseGraph, tryResumeGraph } = useGraphExecutor();

  useMenuCommands({
    onRunGraph: tryRunGraph,
  });

  return (
    <div className="app" css={styles}>
      <MenuBar
        onRunGraph={tryRunGraph}
        onAbortGraph={tryAbortGraph}
        onPauseGraph={tryPauseGraph}
        onResumeGraph={tryResumeGraph}
      />
      <LeftSidebar />
      <GraphBuilder />
      <SettingsModal />
      <PromptDesignerRenderer />
      <GraphTesterRenderer />
      <ToastContainer position="bottom-right" hideProgressBar newestOnTop />
    </div>
  );
};
