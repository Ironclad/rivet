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
                  <a href="/docs">Documentation</a>
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
          <h2>Why Rivet?</h2>
          <div className={styles['card-grid']}>
            <div className={styles['card-3']}>
              <h3>Visualize and Build</h3>
              <p>Visualize and build complex chains to create applications for production — not just prototyping.</p>
            </div>
            <div className={styles['card-3']}>
              <h3>Debug Remotely</h3>
              <p>
                See what's under the hood and observe the execution of prompt chains in your application, in real-time.
              </p>
            </div>
            <div className={styles['card-3']}>
              <h3>Collaborate</h3>
              <p>
                Rivet graphs are just YAML files, so you can version them in your team's repository, and review them
                using your favorite code review tools.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id={styles['demo-video']}>
        <div className={styles.sectionContent}>
          <h2>See it in Action</h2>
          <div id={styles['video-container']}>
            <iframe
              src="https://www.loom.com/embed/081c206893434b2e9d55020da5beedde?sid=0b389a29-6244-4309-80a8-71202e11c9ef"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </section>

      <section id={styles['use-cases']}>
        <div className={styles.sectionContent}>
          <h2>What the Community is Saying</h2>
          <div className={styles['card-grid']}>
            <div className={styles['card-3']}>
              <p className={styles.quote}>
                Rivet's visual programming environment feels like a game-changer. You have to experience it to believe
                it.
              </p>
              <p className="quote-attribution">Todd Berman, CTO at Attentive</p>
            </div>
            <div className={styles['card-3']}>
              <p className={styles.quote}>
                Rivet is awesome! We're loving Rivet, and figuring out when we can put it out into the wild.
              </p>
              <p className="quote-attribution">Teddy Coleman, CTO at Willow Servicing</p>
            </div>
            <div className={styles['card-3']}>
              <p className={styles.quote}>Rivet made it super easy to prototype our Bento AI builder experience.</p>
              <p className="quote-attribution">Emily Wang, CEO at Bento</p>
            </div>
            <div className={styles['card-3']}>
              <p className={styles.quote}>
                We're excited to see Rivet making audio prompt chains easy to prototype and deploy!
              </p>
              <p className="quote-attribution">Domenic Donato, VP of Technology at AssemblyAI</p>
            </div>
            <div className={styles['card-3']}>
              <p className={styles.quote}>
                We've had fun experimenting with Rivet, and are excited to natively integrate it with Braintrust!
              </p>
              <p className="quote-attribution">Ankur Goyal, CEO at Braintrust</p>
            </div>
          </div>
        </div>
      </section>

      <section id={styles['get-started']}>
        <div className={styles.sectionContent}>
          <h2>Get Started</h2>
          <p>Start building AI agents with Rivet in just a few simple steps.</p>
        </div>
      </section>

      <footer>
        <div className={styles.sectionContent}>
          <p>&copy; 2023 Ironclad, Inc. All rights reserved.</p>
        </div>
      </footer>

      <script src="js/script.js"></script>
    </main>
  );
}
