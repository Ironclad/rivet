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
        <p>
          <img alt="Ironclad" className={styles.inlineLogo} src="img/ironclad-logo.png" height="16px" /> is the leading digital
          contracting platform.
          {' '}
          <a href="https://ironcladapp.com/product/ai-based-contract-management/" target="_blank">Ironclad AI</a>
          {' '}
          helps legal teams with everything from reviewing contracts faster to answering questions about their obligations.
          {' '}
          Learn more at <a href="https://www.ironcladapp.com/" target="_blank">ironcladapp.com</a>.
        </p>
        <p>Rivet is built and used by <img alt="Ironclad" className={styles.inlineLogo} src="img/ironclad-logo.png" height="16px" /> Research.</p>
      </div>
    </Section>
  );
};
