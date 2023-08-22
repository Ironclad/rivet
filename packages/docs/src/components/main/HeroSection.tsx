import * as React from 'react';
import { Section } from './Section';

import styles from './HeroSection.module.css';

export const HeroSection: React.FC<{ id?: string }> = ({ id }) => {
  return (
    <Section id={id}>
      <h1 className={styles.title}>The Open-Source Visual AI Programming Environment</h1>
      <a className={styles.downloadButton} href="#get-started">
        Download
      </a>
      <div className={styles.imgContainer}>
        <img className={styles.img} height="300px" src="img/graph.png" alt="Rivet Graph" />
      </div>
    </Section>
  );
};
