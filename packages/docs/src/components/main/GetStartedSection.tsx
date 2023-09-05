import * as React from 'react';
import { Section } from './Section';

export const GetStartedSection: React.FC<{ id?: string }> = ({ id }) => {
  return (
    <Section id={id}>
      <h2>Get Started</h2>
      <p>Start building AI agents with Rivet in just a few simple steps.</p>
    </Section>
  );
};
