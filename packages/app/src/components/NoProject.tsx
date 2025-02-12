import Button from '@atlaskit/button';
import { css } from '@emotion/react';
import { type FC } from 'react';
import { useOpenUrl } from '../hooks/useOpenUrl';
import DiscordIcon from '../assets/vendor_logos/discord-mark-white.svg?react';
import GearIcon from 'majesticons/line/settings-cog-line.svg?react';
import RivetIcon from '../rivet-logo-1024-full.png';
import { useSetAtom } from 'jotai';
import { newProjectModalOpenState } from '../state/ui';
import { settingsModalOpenState } from './SettingsModal';
import { useLoadProjectWithFileBrowser } from '../hooks/useLoadProjectWithFileBrowser';
import { syncWrapper } from '../utils/syncWrapper';

const styles = css`
  background: var(--grey-darker);
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;

  .inner {
    position: relative;
    background: var(--grey-dark);
    color: var(--grey-light);
    width: 75vh;
    height: 50vh;
    padding: 50px;
    min-width: 600px;
    min-height: 400px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  h1 {
    margin: 0;
  }

  .inner > ul {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 20px;

    > li {
      border-left: 4px solid var(--grey-light);
      padding-left: 8px;

      p {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }

      a {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
    }
  }

  .logo {
    position: absolute;
    right: 50px;
    top: 50px;
    width: 100px;
  }

  .open-settings {
    position: absolute;
    top: 0;
    right: 0;
    width: 64px;
    height: 64px;
    display: flex;
  }
`;

export const NoProject: FC = () => {
  const openDocumentation = useOpenUrl('https://rivet.ironcladapp.com/docs');
  const joinDiscord = useOpenUrl('https://discord.gg/qT8B2gv9Mg');
  const setNewProjectModalOpen = useSetAtom(newProjectModalOpenState);
  const setSettingsModalOpen = useSetAtom(settingsModalOpenState);
  const openProject = useLoadProjectWithFileBrowser();

  return (
    <div css={styles}>
      <div className="inner">
        <img src={RivetIcon} alt="Rivet Logo" className="logo" />
        <Button className="open-settings" onClick={() => setSettingsModalOpen(true)}>
          <GearIcon />
        </Button>
        <h1>Welcome to Rivet!</h1>
        <p>No project is currently open. You can:</p>

        <ul>
          <li>
            <Button appearance="primary" onClick={syncWrapper(openProject)}>
              Open
            </Button>{' '}
            an existing project
          </li>
          <li>
            <Button appearance="primary" onClick={() => setNewProjectModalOpen(true)}>
              Create
            </Button>{' '}
            a new project
          </li>
          <li>
            <p>
              Check out the{' '}
              <a href="#" onClick={syncWrapper(openDocumentation)}>
                Rivet documentation
              </a>
            </p>
          </li>
          <li>
            <p>
              Need help? join the{' '}
              <a href="#" onClick={syncWrapper(joinDiscord)}>
                <DiscordIcon /> Discord Server
              </a>{' '}
              for ideas, support, and community
            </p>
          </li>
        </ul>
      </div>
    </div>
  );
};
