import * as React from 'react';
import mainStyles from './styles.module.css';
import styles from './logo-banner.module.css';

export default function SocialCardPage() {
  return (
    <main className={mainStyles.main}>
      <div className={styles.wrapper}>
        <div className={styles.card}>
          <div className={styles.lines} />
          <div className={styles.content}>
            <div className={styles.logo}>
              <img width="50" height="50" src="img/logo.svg" alt="Rivet App Logo" />
              <span className={styles.rivetText}>Rivet</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
