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
                <span>Rivet</span>
              </a>
              <ul>
                <li>
                  <a href="#about">About</a>
                </li>
                <li>
                  <a href="/docs">Documentation</a>
                </li>
                <li>
                  <a className="primary" href="#get-started">
                    Start Here
                  </a>
                </li>
              </ul>
            </nav>
          </header>
          <h1>An Open-Source Visual AI Programming Environment</h1>
          <a id={styles['start-button']} href="#get-started">
            Start Here
          </a>
          <div>
            <img height="300px" src="img/graph.png" alt="Rivet Graph" />
          </div>
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
