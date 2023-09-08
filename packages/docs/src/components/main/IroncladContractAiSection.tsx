import * as React from 'react';
import { Section } from './Section';

import styles from './IroncladContractAiSection.module.css';

export const IroncladContractAiSection: React.FC<{ id?: string }> = ({ id }) => {
  React.useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://fast.wistia.com/embed/medias/j74id7k4zx.jsonp';
    script.async = true;
    const scriptIe = document.createElement('script');
    scriptIe.src = 'https://fast.wistia.com/assets/external/E-v1.js';
    scriptIe.async = true;
    document.body.appendChild(script);
    document.body.appendChild(scriptIe);
    return () => {
      document.body.removeChild(script);
      document.body.removeChild(scriptIe);
    };
  });
  const wistiaSwatch = React.useRef<HTMLDivElement>();

  return (
    <Section id={id}>
      <h2 className={styles.title}>
        <img alt="Ironclad" className={styles.inlineLogo} src="img/ironclad-logo-white.png" height="24px" /> Contract AI
      </h2>
      <p>
        Ironclad Contract AI (CAI) is a virtual contract assistant, powered by AI agents, and developed with Rivet. CAI
        is capable of answering diverse questions about every stage of the contract lifecycle, directly using Ironclad's
        existing capabilities, like contract search, workflow process, and data visualization.
      </p>
      <p>
        You can{' '}
        <a href="https://ironcladapp.com/product/ironclad-contract-ai/" target="_blank">
          learn more about CAI here
        </a>
        .
      </p>
      <div className="wistia_responsive_padding" style={{ padding: '56.25% 0 0 0', position: 'relative' }}>
        <div
          className="wistia_responsive_wrapper"
          style={{ height: '100%', left: '0', position: 'absolute', top: '0', width: '100%' }}
        >
          <div
            className="wistia_embed wistia_async_j74id7k4zx seo=true videoFoam=true"
            style={{ height: '100%', position: 'relative', width: '100%' }}
          >
            <div
              ref={wistiaSwatch}
              className="wistia_swatch"
              style={{
                height: '100%',
                left: '0',
                opacity: '0',
                overflow: 'hidden',
                position: 'absolute',
                top: '0',
                transition: 'opacity 200ms',
                width: '100%',
              }}
            >
              <img
                src="https://fast.wistia.com/embed/medias/j74id7k4zx/swatch"
                style={{ filter: 'blur(5px)', height: '100%', objectFit: 'contain', width: '100%' }}
                alt=""
                aria-hidden="true"
                onLoad={() => {
                  wistiaSwatch.current.style.opacity = '1';
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};
