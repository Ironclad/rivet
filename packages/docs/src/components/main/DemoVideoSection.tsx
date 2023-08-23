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
          src="https://www.loom.com/embed/081c206893434b2e9d55020da5beedde?sid=0b389a29-6244-4309-80a8-71202e11c9ef"
          allowFullScreen
        />
      </div>
    </Section>
  );
};
