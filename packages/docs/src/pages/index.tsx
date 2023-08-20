import * as React from 'react';
import styles from './styles.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.lines} />
      <section id={styles.hero}>
        <div className={styles.sectionContent}>
          <header>
            <nav id={styles['main-nav']}>
              <a href="/" id={styles.logo}>
                <img width="40" height="40" src="img/logo.svg" alt="Rivet App Logo" />
                <span id={styles['logo-word-mark']}>Rivet</span>
              </a>
              <ul>
                <li id={styles['nav-about']}>
                  <a href="https://github.com/Ironclad/rivet" target="_blank">
                    Github
                  </a>
                </li>
                <li id={styles['nav-documentation']}>
                  <a href="https://rivet.ironcladapp.com" target="_blank">
                    Documentation
                  </a>
                </li>
                <li id={styles['nav-get-started']}>
                  <a className="primary" href="#get-started">
                    Download
                  </a>
                </li>
              </ul>
            </nav>
          </header>
          <h1>The Open-Source Visual AI Programming Environment</h1>
          <a id={styles['start-button']} href="#get-started">
            Download
          </a>
          <div>
            <img height="300px" src="img/graph.png" alt="Rivet Graph" id={styles['rivet-graph-img']} />
          </div>
        </div>
      </section>

      <section id={styles['what-is-rivet']}>
        <div className={styles.sectionContent}>
          <h2>What is Rivet?</h2>
          <p>
            Rivet is a visual programming environment for building AI agents with LLMs. Iterate on your prompt graphs in
            Rivet, then run them directly in your application. With Rivet, teams can effectively design, debug, and
            collaborate on complex LLM prompt graphs, and deploy them in their own environment.
          </p>
          <p>
            At Ironclad, we struggled to build AI agents programmatically. Rivet's visual environment, easy debugger,
            and remote executor unlocked our team's ability to collaborate on increasingly complex and powerful LLM
            prompt graphs.
          </p>
          <p>Built and used by Ironclad Research.</p>
        </div>
      </section>

      <section id={styles.features}>
        <div className={styles.sectionContent}>
          <h2>Features</h2>
          <ul>
            <li>Visual, graph-based programming</li>
          </ul>
        </div>
      </section>

      <section id={styles['get-started']}>
        <div className={styles.sectionContent}>
          <h2>Get Started</h2>
          <p>Start building AI agents with Rivet in just a few simple steps.</p>
        </div>
      </section>

      <section id={styles.example}>
        <div className={styles.sectionContent}>
          <h2>Example</h2>
          <div id="example-video"></div>
        </div>
      </section>

      <footer>
        <div className={styles.sectionContent}>
          <p>&copy; 2023 Rivet. All rights reserved.</p>
        </div>
      </footer>

      <script src="js/script.js"></script>
    </main>
  );
}
