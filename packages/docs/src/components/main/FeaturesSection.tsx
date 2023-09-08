import * as React from 'react';
import { Section } from './Section';

import layout from '../../css/layout.module.css';

export const FeaturesSection: React.FC<{ id?: string }> = ({ id }) => {
  return (
    <Section id={id}>
      <h2>Why Rivet?</h2>
      <div className={layout.card3}>
        <div>
          <h3>Visualize and Build</h3>
          <p>Visualize and build complex chains to create applications for production — not just prototyping.</p>
        </div>
        <div>
          <h3>Debug Remotely</h3>
          <p>See what's under the hood and observe the execution of prompt chains in your application, in real-time.</p>
        </div>
        <div>
          <h3>Collaborate</h3>
          <p>
            Rivet graphs are just YAML files, so you can version them in your team's repository, and review them using
            your favorite code review tools.
          </p>
        </div>
      </div>
    </Section>
  );
};
