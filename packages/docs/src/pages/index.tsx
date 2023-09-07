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

export default function Home() {
  return (
    <main className={styles.main}>
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
