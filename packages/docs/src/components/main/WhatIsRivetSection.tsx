import * as React from 'react';
import { Section } from './Section';

import styles from './WhatIsRivetSection.module.css';

export const WhatIsRivetSection: React.FC<{ id?: string }> = ({ id }) => {
  return (
    <Section id={id}>
      <h2>What is Rivet?</h2>
      <div className={styles.text}>
        <p>
          Rivet is a visual programming environment for building AI agents with LLMs. Iterate on your prompt graphs in
          Rivet, then run them directly in your application. With Rivet, teams can effectively design, debug, and
          collaborate on complex LLM prompt graphs, and deploy them in their own environment.
        </p>
        <p>
          At Ironclad, we struggled to build AI agents programmatically. Rivet's visual environment, easy debugger, and
          remote executor unlocked our team's ability to collaborate on increasingly complex and powerful LLM prompt
          graphs.
        </p>
        <p>Built and used by Ironclad Research.</p>
      </div>
    </Section>
  );
};
