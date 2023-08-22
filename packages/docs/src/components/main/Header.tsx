import * as React from 'react';
import clsx from 'clsx';

import layout from '../../css/layout.module.css';
import styles from './Header.module.css';

export const Header: React.FC = () => {
  return (
    <header className={styles.header}>
      <div className={layout.contentWrapper}>
        <nav className={styles.nav}>
          <a className={styles.logo} href="/">
            <img width="40" height="40" src="img/logo.svg" alt="Rivet App Logo" />
            <span className={styles.logoText}>Rivet</span>
          </a>
          <ul className={styles.navList}>
            <li id={styles.github}>
              <a className={styles.navLink} href="https://github.com/Ironclad/rivet" target="_blank">
                GitHub
              </a>
            </li>
            <li id={styles.documentation}>
              <a className={styles.navLink} href="/docs">
                Documentation
              </a>
            </li>
            <li id={styles.download}>
              <a className={clsx(styles.navLink, styles.primary)} href="#download">
                Download
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};
