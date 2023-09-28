import * as React from 'react';
import { Section } from './Section';

export const GetStartedSection: React.FC<{ id?: string }> = ({ id }) => {
  return (
    <Section id={id}>
      <h2>Get Started</h2>
      <p>Start building AI agents with Rivet in just a few simple steps!</p>
      <ul>
        <li>
          Follow the <a href="/docs/getting-started/installation">Getting Started</a> guide, to learn how to build AI
          agent graphs in Rivet.
        </li>
        <li>
          <a href="docs/api-reference/getting-started-integration">Integrate Rivet</a> into your Node or TypeScript
          application.
        </li>
        <li>
          Experiment with the{' '}
          <a href="https://github.com/Ironclad/rivet-example" target="_blank">
            Rivet example application
          </a>
          , to get a sense for what developing and debugging a chat application looks like in Rivet.
        </li>
      </ul>
    </Section>
  );
};
