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
            Rivet really addressed some limitations that we were hitting up against... and some we didn't know we had. The visualization makes a big difference when working through agentic logic and really makes it easy to see what the AI is doing. But the ability to debug and collaborate across the team made a huge difference as well - we've used it to launch our virtual mortgage servicing agent and are excited to see how the tool continues to evolve.
          </p>
          <p className={styles.quoteAttribution}>Teddy Coleman, CTO at <a href="https://www.willowservicing.com/" target="_blank">Willow Servicing</a></p>
        </div>
        <div className={layout.card3}>
          <p className={styles.quote}>
            In order to build great product experiences we have to be able to iterate quickly. Leveraging tools like Rivet allows us to more accurately understand the tradeoffs between things like speed and quality as we build AI-powered experiences in Bento.
          </p>
          <p className={styles.quoteAttribution}>Emily Wang, CEO at <a href="https://www.trybento.co/" target="_blank">Bento</a></p>
        </div>
        <div className={layout.card3}>
          <p className={styles.quote}>
            Rivet is an amazing tool for rapidly prototyping and visually understanding complex AI workflows. It's been wonderful collaborating with Ironclad to integrate AssemblyAI's audio transcription and understanding models into the Rivet ecosystem. We're excited to see what developers create equipped with such a powerful and capable toolkit!
          </p>
          <p className={styles.quoteAttribution}>Domenic Donato, VP of Technology at <a href="https://www.assemblyai.com/" target="_blank">AssemblyAI</a></p>
        </div>
        <div className={layout.card3}>
          <p className={styles.quote}>
            Rivet is a super slick and compelling tool for prompt construction and LLM composition, particularly when you're trying to combine AI with many existing tools and APIs. I can see this becoming a popular tool for those working on robust and reliable AI applications.
          </p>
          <p className={styles.quoteAttribution}>Beyang Liu, CTO at <a href="https://www.sourcegraph.com/" target="_blank">Sourcegraph</a></p>
        </div>
      </div>
    </Section>
  );
};
