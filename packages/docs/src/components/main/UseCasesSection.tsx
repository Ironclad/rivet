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
            Rivet's visual programming environment feels like a game-changer. You have to experience it to believe it.
          </p>
          <p className={styles.quoteAttribution}>Todd Berman, CTO at Attentive</p>
        </div>
        <div className={layout.card3}>
          <p className={styles.quote}>
            Rivet is awesome! We're loving Rivet, and figuring out when we can put it out into the wild.
          </p>
          <p className={styles.quoteAttribution}>Teddy Coleman, CTO at Willow Servicing</p>
        </div>
        <div className={layout.card3}>
          <p className={styles.quote}>Rivet made it super easy to prototype our Bento AI builder experience.</p>
          <p className={styles.quoteAttribution}>Emily Wang, CEO at Bento</p>
        </div>
        <div className={layout.card3}>
          <p className={styles.quote}>
            We're excited to see Rivet making audio prompt chains easy to prototype and deploy!
          </p>
          <p className={styles.quoteAttribution}>Domenic Donato, VP of Technology at AssemblyAI</p>
        </div>
        <div className={layout.card3}>
          <p className={styles.quote}>
            We've had fun experimenting with Rivet, and are excited to natively integrate it with Braintrust!
          </p>
          <p className={styles.quoteAttribution}>Ankur Goyal, CEO at Braintrust</p>
        </div>
      </div>
    </Section>
  );
};
