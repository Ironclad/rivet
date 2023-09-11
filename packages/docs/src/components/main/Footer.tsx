import * as React from 'react';

import layout from '../../css/layout.module.css';
import styles from './Footer.module.css';
import { useDownloadUrl } from '../../hooks/useDownloadUrl';

export const Footer: React.FC = () => {
  const { platform } = useDownloadUrl();

  return (
    <footer className={styles.footer}>
      <div className={layout.contentWrapper}>
        <p className={styles.text}>&copy; 2023 Ironclad, Inc. All rights reserved.</p>
        <ul className={styles.attribution}>
          {platform === 'linux' && (
            <li>Linux&#174; is the registered trademark of Linus Torvalds in the U.S. and other countries.</li>
          )}
        </ul>
      </div>
    </footer>
  );
};
