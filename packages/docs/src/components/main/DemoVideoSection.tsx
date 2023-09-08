import * as React from 'react';
import { Section } from './Section';

import styles from './DemoVideoSection.module.css';

export const DemoVideoSection: React.FC<{ id?: string }> = ({ id }) => {
  return (
    <Section id={id}>
      <h2>See it in Action</h2>
      <div className={styles.videoContainer}>
        <iframe
          className={styles.video}
          width="560"
          height="315"
          src="https://www.youtube.com/embed/HhgM9MiShwA?si=ULy6PThLVtV7D-Ab&rel=0"
          title="Rivet Demo"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </Section>
  );
};
