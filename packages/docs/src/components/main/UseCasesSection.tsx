import * as React from 'react';
import clsx from 'clsx';
import { Section } from './Section';

import layout from '../../css/layout.module.css';
import styles from './UseCasesSection.module.css';

export const Quote: React.FC<{
  quote: string;
  attribution: string;
  profileUrl: string;
  profileAlt: string;
  logoUrl: string;
  logoAlt: string;
  linkUrl: string;
}> = ({ quote, attribution, profileUrl, profileAlt, logoUrl, logoAlt, linkUrl }) => (
  <div>
    <p className={styles.message}>{quote}</p>
    <div className={styles.attribution}>
      <img className={styles.picture} width={80} src={profileUrl} alt={profileAlt} />
      <div className={styles.attributionWrapper}>
        <p className={styles.title}>{attribution}</p>
        <a className={styles.logoLink} href={linkUrl} target="_blank">
          <img className={styles.logo} src={logoUrl} alt={logoAlt} />
        </a>
      </div>
    </div>
  </div>
);

export const UseCasesSection: React.FC<{ id?: string }> = ({ id }) => {
  return (
    <Section id={id}>
      <h2>What the Community is Saying</h2>
      <div className={clsx(layout.card2, styles.cardGrid)}>
        <Quote
          attribution="Todd Berman, CTO"
          linkUrl="https://www.attentive.com/"
          logoAlt="Attentive"
          logoUrl="img/use-case-quotes/logo-attentive.svg"
          profileAlt="Todd Berman"
          profileUrl="img/use-case-quotes/profile-todd-berman.jpeg"
          quote="Rivet's visual programming environment is a game-changer. The visual nature of the tool, paired with how
          collaborative it is, allows us to create complex chains for AI agents in drastically less time than it would take
          in other environments. It's the best tool out there."
        />
        {/** TODO: convert the other quotes to use the Quote component */}
        <Quote
          attribution="Teddy Coleman, CTO"
          linkUrl="https://www.willowservicing.com/"
          logoAlt="Willow Servicing"
          logoUrl="img/use-case-quotes/logo-willow.webp"
          profileAlt="Teddy Coleman"
          profileUrl="img/use-case-quotes/profile-teddy-coleman.jpeg"
          quote="Rivet really addressed some limitations that we were hitting up against... and some we didn't know we had.
          The visualization makes a big difference when working through agentic logic and really makes it easy to see
          what the AI is doing. But the ability to debug and collaborate across the team made a huge difference as
          well - we've used it to launch our virtual mortgage servicing agent and are excited to see how the tool
          continues to evolve."
        />
        <Quote
          attribution="Emily Wang, CEO"
          linkUrl="https://www.trybento.co/products/bentoai"
          logoAlt="Bento"
          logoUrl="img/use-case-quotes/logo-bento.svg"
          profileAlt="Emily Wang"
          profileUrl="img/use-case-quotes/profile-emily-wang.jpeg"
          quote="In order to build great product experiences we have to be able to iterate quickly. Leveraging tools like
          Rivet allows us to more accurately understand the tradeoffs between things like speed and quality as we
          build AI-powered experiences in Bento."
        />
        <Quote
          attribution="Domenic Donato, VP of Technology"
          linkUrl="https://www.assemblyai.com/"
          logoAlt="AssemblyAI"
          logoUrl="img/use-case-quotes/logo-assemblyai.svg"
          profileAlt="Domenic Donato"
          profileUrl="img/use-case-quotes/profile-domenic-donato.jpeg"
          quote="Rivet is an amazing tool for rapidly prototyping and visually understanding complex AI workflows. It's been
          wonderful collaborating with Ironclad to integrate AssemblyAI's audio transcription and understanding models
          into the Rivet ecosystem. We're excited to see what developers create equipped with such a powerful and
          capable toolkit!"
        />
        <Quote
          attribution="Beyang Liu, CTO"
          linkUrl="https://www.sourcegraph.com/"
          logoAlt="Sourcegraph"
          logoUrl="img/use-case-quotes/logo-sourcegraph.svg"
          profileAlt="Beyang Liu"
          profileUrl="img/use-case-quotes/profile-beyang-liu.jpeg"
          quote="Rivet is a super slick and compelling tool for prompt construction and LLM composition, particularly when
          you're trying to combine AI with many existing tools and APIs. I can see this becoming a popular tool for
          those working on robust and reliable AI applications."
        />
      </div>
    </Section>
  );
};
