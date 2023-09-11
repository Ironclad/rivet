import * as React from 'react';
import { Header } from '../components/main/Header';
import { HeroSection } from '../components/main/HeroSection';
import { WhatIsRivetSection } from '../components/main/WhatIsRivetSection';
import { FeaturesSection } from '../components/main/FeaturesSection';
import { DemoVideoSection } from '../components/main/DemoVideoSection';
import { UseCasesSection } from '../components/main/UseCasesSection';
import { IroncladContractAiSection } from '../components/main/IroncladContractAiSection';
import { GetStartedSection } from '../components/main/GetStartedSection';
import { Footer } from '../components/main/Footer';

import styles from './styles.module.css';
import Head from '@docusaurus/Head';

export default function Home() {
  return (
    <main className={styles.main}>
      <Head>
        <meta property="og:title" content="Rivet" />
        <meta
          property="og:description"
          content="An open-source AI programming environment using a visual, node-based graph editor"
        />
        <meta property="og:image" content="https://rivet.ironcladapp.com/img/social-card.png" />
        <meta name="twitter:title" content="Rivet" />
        <meta
          name="twitter:description"
          content="An open-source AI programming environment using a visual, node-based graph editor"
        />
        <meta name="twitter:image" content="https://rivet.ironcladapp.com/img/social-card.png" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <Header />

      <HeroSection id="hero" />
      <WhatIsRivetSection id="what-is-rivet" />
      <FeaturesSection id="features" />
      <DemoVideoSection id="demo-video" />
      <UseCasesSection id="use-cases" />
      <IroncladContractAiSection id="ironclad-contract-ai" />
      <GetStartedSection id="get-started" />

      <Footer />

      {/** Background */}
      <div className={styles.lines} />
    </main>
  );
}
