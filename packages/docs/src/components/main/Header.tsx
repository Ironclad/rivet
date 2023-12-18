import * as React from 'react';
import { useState } from 'react';
import clsx from 'clsx';

import layout from '../../css/layout.module.css';
import styles from './Header.module.css';
import { useDownloadUrl } from '../../hooks/useDownloadUrl';

import GithubLogo from './logos/github-mark-white.svg';
import DiscordLogo from './logos/discord-mark-white.svg';
import YouTubeLogo from './logos/youtube-mark-white.svg';

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { downloadUrl } = useDownloadUrl();

  return (
    <header className={clsx(styles.header, { [styles.menuOpen]: isMenuOpen })}>
      <div className={layout.contentWrapper}>
        <nav className={styles.nav}>
          <a className={styles.logo} href="/">
            <img width="40" height="40" src="img/logo.svg" alt="Rivet App Logo" />
            <span className={styles.logoText}>Rivet</span>
          </a>
          <div
            className={clsx(styles.hamburger, { [styles.menuOpen]: isMenuOpen })}
            onClick={() => setIsMenuOpen((prev) => !prev)}
          />
          <ul className={clsx(styles.navList, { [styles.menuOpen]: isMenuOpen })}>
            <li className={styles.discord}>
              <a className={styles.navLink} href="https://discord.gg/qT8B2gv9Mg" target="_blank">
                <DiscordLogo viewBox="0 0 127 96" />
                <span className={styles.menuText}>Discord</span>
              </a>
            </li>
            <li className={styles.github}>
              <a className={styles.navLink} href="https://github.com/Ironclad/rivet" target="_blank">
                <GithubLogo viewBox="0 0 100 100" />
                <span className={styles.menuText}>GitHub</span>
              </a>
            </li>
            <li className={styles.github}>
              <a className={styles.navLink} href="https://www.youtube.com/@rivet_ts" target="_blank">
                <YouTubeLogo viewBox="0 -20 240 220" />
                <span className={styles.menuText}>YouTube</span>
              </a>
            </li>
            <li className={styles.documentation}>
              <a className={styles.navLink} href="/docs">
                Documentation
              </a>
            </li>
            <li className={styles.download}>
              <a className={clsx(styles.navLink, styles.primary)} href={downloadUrl} target="_blank">
                Download
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};
