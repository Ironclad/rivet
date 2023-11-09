import Button from '@atlaskit/button';
import { WebviewWindow } from '@tauri-apps/api/window';
import { type FC } from 'react';
import { useSetRecoilState } from 'recoil';
import { getCommunityLoginUrl } from '../../utils/getCommunityApi';
import { isLoggedInToCommunityState } from '../../state/community';

export const NeedsLoginPage: FC = () => {
  const loginUrl = getCommunityLoginUrl();
  const setIsLoggedInToCommunity = useSetRecoilState(isLoggedInToCommunityState);

  const handleLogInClick = () => {
    const window = new WebviewWindow('login', { alwaysOnTop: true, center: true, url: loginUrl });

    window.once('tauri://created', () => {
      console.log('window created');
    });

    window.once('tauri://error', (e) => {
      console.error(e);
    });

    window.onCloseRequested(() => {
      setIsLoggedInToCommunity(undefined);
    });
  };

  return (
    <div className="needs-login">
      <h1>Log in to Rivet Community</h1>
      <p>Log in to Rivet Community to:</p>
      <ul>
        <li>Share your templates with others</li>
        <li>Star and comment on other templates</li>
      </ul>
      <p>
        <Button appearance="primary" onClick={handleLogInClick}>
          Log in
        </Button>
      </p>
    </div>
  );
};
