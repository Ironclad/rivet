import * as React from 'react';
import { Section } from './Section';

import layout from '../../css/layout.module.css';
import styles from './UseCasesSection.module.css';

export const UseCasesSection: React.FC<{ id?: string }> = ({ id }) => {
  return (
    <Section id={id}>
      <h2>What the Community is Saying</h2>
      <div className={layout.cardGrid}>
        <div className={layout.card2}>
          <p className={styles.quote}>
            Rivet's visual programming environment is a game-changer. The visual nature of the tool, paired with how collaborative it is, allows us to create complex chains for AI agents in drastically less time than it would take in other environments. It's the best tool out there.
          </p>
          <div className={styles.quoteImageContainer}>
            <img className={styles.quoteProfile} src="img/use-case-quotes/profile-todd-berman.jpeg" alt="Todd Berman" />
          </div>
          <p className={styles.quoteAttribution}>Todd Berman, CTO</p>
          <a className={styles.quoteLogoLink} href="https://www.attentive.com/" target="_blank">
            <img className={styles.quoteLogo} src="img/use-case-quotes/logo-attentive.svg" alt="Attentive" />
          </a>
        </div>
        <div className={layout.card2}>
          <p className={styles.quote}>
            Rivet really addressed some limitations that we were hitting up against... and some we didn't know we had. The visualization makes a big difference when working through agentic logic and really makes it easy to see what the AI is doing. But the ability to debug and collaborate across the team made a huge difference as well - we've used it to launch our virtual mortgage servicing agent and are excited to see how the tool continues to evolve.
          </p>
          <div className={styles.quoteImageContainer}>
            <img className={styles.quoteProfile} src="img/use-case-quotes/profile-teddy-coleman.jpeg" alt="Teddy Coleman" />
          </div>
          <p className={styles.quoteAttribution}>Teddy Coleman, CTO</p>
          <a className={styles.quoteLogoLink} href="https://www.willowservicing.com/" target="_blank">
            <img className={styles.quoteLogo} src="img/use-case-quotes/logo-willow.webp" alt="Willow Servicing" />
          </a>
        </div>
        <div className={layout.card2}>
          <p className={styles.quote}>
            In order to build great product experiences we have to be able to iterate quickly. Leveraging tools like Rivet allows us to more accurately understand the tradeoffs between things like speed and quality as we build AI-powered experiences in Bento.
          </p>
          <div className={styles.quoteImageContainer}>
            <img className={styles.quoteProfile} src="img/use-case-quotes/profile-emily-wang.jpeg" alt="Emily Wang" />
          </div>
          <p className={styles.quoteAttribution}>Emily Wang, CEO</p>
          <a className={styles.quoteLogoLink} href="https://www.trybento.co/products/bentoai" target="_blank">
            <img className={styles.quoteLogo} src="img/use-case-quotes/logo-bento.svg" alt="Bento" />
          </a>
        </div>
        <div className={layout.card2}>
          <p className={styles.quote}>
            Rivet is an amazing tool for rapidly prototyping and visually understanding complex AI workflows. It's been wonderful collaborating with Ironclad to integrate AssemblyAI's audio transcription and understanding models into the Rivet ecosystem. We're excited to see what developers create equipped with such a powerful and capable toolkit!
          </p>
          <div className={styles.quoteImageContainer}>
            <img className={styles.quoteProfile} src="img/use-case-quotes/profile-domenic-donato.jpeg" alt="Domenic Donato" />
          </div>
          <p className={styles.quoteAttribution}>Domenic Donato, VP of Technology</p>
          <a className={styles.quoteLogoLink} href="https://www.assemblyai.com/" target="_blank">
            <img className={styles.quoteLogo} src="img/use-case-quotes/logo-assemblyai.svg" alt="AssemblyAI" />
          </a>
        </div>
        <div className={layout.card2}>
          <p className={styles.quote}>
            Rivet is a super slick and compelling tool for prompt construction and LLM composition, particularly when you're trying to combine AI with many existing tools and APIs. I can see this becoming a popular tool for those working on robust and reliable AI applications.
          </p>
          <div className={styles.quoteImageContainer}>
            <img className={styles.quoteProfile} src="img/use-case-quotes/profile-beyang-liu.jpeg" alt="Beyang Liu" />
          </div>
          <p className={styles.quoteAttribution}>Beyang Liu, CTO</p>
          <a className={styles.quoteLogoLink} href="https://www.sourcegraph.com/" target="_blank">
            <img className={styles.quoteLogo} src="img/use-case-quotes/logo-sourcegraph.svg" alt="Sourcegraph" />
          </a>
        </div>
      </div>
    </Section>
  );
};
