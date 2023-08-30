import * as React from 'react';
import { Section } from './Section';

import layout from '../../css/layout.module.css';
import styles from './UseCasesSection.module.css';

export const UseCasesSection: React.FC<{ id?: string }> = ({ id }) => {
  return (
    <Section id={id}>
      <h2>What the Community is Saying</h2>
      <div className={layout.cardGrid}>
        <div className={layout.card3}>
          <p className={styles.quote}>
            Rivet's visual programming environment is a game-changer. The visual nature of the tool, paired with how collaborative it is, allows us to create complex chains for AI agents in drastically less time than it would take in other environments. It's the best tool out there.
          </p>
          <p className={styles.quoteAttribution}>Todd Berman, CTO at <a href="https://www.attentive.com/" target="_blank">Attentive</a></p>
        </div>
        <div className={layout.card3}>
          <p className={styles.quote}>
            Rivet is awesome! It makes it super simple to see what the AI is doing. We've used it to launch our virtual mortgage servicing agent.
          </p>
          <p className={styles.quoteAttribution}>Teddy Coleman, CTO at <a href="https://www.willowservicing.com/" target="_blank">Willow Servicing</a></p>
        </div>
        <div className={layout.card3}>
          <p className={styles.quote}>Rivet made it super easy to prototype our Bento AI builder experience.</p>
          <p className={styles.quoteAttribution}>Emily Wang, CEO at <a href="https://www.trybento.co/" target="_blank">Bento</a></p>
        </div>
        <div className={layout.card3}>
          <p className={styles.quote}>
            With AssemblyAI, Rivet makes audio prompt chains easy to prototype and deploy. Supporting sophisticated LLM applications becomes much easier, by decreasing complexity and increasing observability.
          </p>
          <p className={styles.quoteAttribution}>Domenic Donato, VP of Technology at <a href="https://www.assemblyai.com/" target="_blank">AssemblyAI</a></p>
        </div>
      </div>
    </Section>
  );
};
