import * as React from 'react';

import layout from '../../css/layout.module.css';
import styles from './Footer.module.css';

export const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={layout.contentWrapper}>
        <p className={styles.text}>&copy; 2023 Ironclad, Inc. All rights reserved.</p>
      </div>
    </footer>
  );
};
