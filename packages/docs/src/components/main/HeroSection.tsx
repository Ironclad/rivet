import * as React from 'react';
import { Section } from './Section';

import styles from './HeroSection.module.css';
import { useDownloadUrl } from './useDownloadUrl';

export const HeroSection: React.FC<{ id?: string }> = ({ id }) => {
  const downloadUrl = useDownloadUrl();
  return (
    <Section className={styles.container} id={id}>
      <h1 className={styles.title}>The Open-Source Visual AI Programming Environment</h1>
      <a className={styles.downloadButton} href={downloadUrl}>
        Download
      </a>
      <a className={styles.latestRelease} href="https://github.com/Ironclad/rivet/releases/latest">
        Latest Release
      </a>
      <div className={styles.imgContainer}>
        <img className={styles.img} height="300px" src="img/graph.png" alt="Rivet Graph" />
      </div>
      <div className={styles.scrollIcon}>&#8744;</div>
    </Section>
  );
};
