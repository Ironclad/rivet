import { deserializeProject, type GraphId, type Project } from '@ironclad/rivet-core';
import { Command } from '@tauri-apps/api/shell';
import isEqual from 'fast-deep-equal';
import Emittery from 'emittery';
import { deserializeProjectAsync } from './deserializeProject';

export type GitRevision = {
  hash: string;
  authorName: string;
  authorEmail: string;
  date: Date;
  message: string;
};

export type CalculatedRevisionProjectInfo = {
  projectBeforeRevision?: Project;
  projectAtRevision?: Project;
  changedGraphs: GraphId[];
};

export type CalculatedRevision = GitRevision & CalculatedRevisionProjectInfo;

export type ProjectRevisionCalculatorEvents = {
  processed: GitRevision & CalculatedRevisionProjectInfo;
  finished: void;
};

export class ProjectRevisionCalculator {
  readonly #projectPath: string;

  delay = 150;

  #gitRevisions: GitRevision[] | undefined;
  #abortController: AbortController | undefined;
  #processQueue: GitRevision[] | undefined;
  #rootDir: string | undefined;
  #relativePath: string | undefined;
  readonly #emitter = new Emittery<ProjectRevisionCalculatorEvents>();

  readonly #processedRevisions: CalculatedRevision[] = [];

  constructor(projectPath: string) {
    this.#projectPath = projectPath;
  }

  get processedRevisions() {
    return [...this.#processedRevisions];
  }

  isRunning() {
    return !!this.#abortController;
  }

  abortProcessing() {
    if (this.#abortController) {
      this.#abortController.abort();
    }
  }

  get numTotalRevisions() {
    return this.#gitRevisions?.length ?? 0;
  }

  get numProcessedRevisions() {
    return this.#processedRevisions.length;
  }

  async startProcessingRevisions() {
    if (!this.#gitRevisions) {
      await this.loadGitRevisions();
    }

    if (this.#abortController) {
      this.#abortController.abort();
    }

    this.#abortController = new AbortController();

    if (!this.#processQueue) {
      this.#processQueue = this.#gitRevisions!.slice();
    }

    this.#processNextRevision();
  }

  on = this.#emitter.on.bind(this.#emitter);
  off = this.#emitter.off.bind(this.#emitter);

  stop() {
    if (this.#abortController) {
      this.#abortController.abort();
    }
  }

  async loadGitRevisions() {
    const pathDirname = this.#projectPath.split('/').slice(0, -1).join('/');

    this.#rootDir = (
      await new Command('git', ['rev-parse', '--show-toplevel'], {
        encoding: 'utf8',
        cwd: pathDirname,
      }).execute()
    ).stdout.trim();

    this.#relativePath = this.#projectPath.replace(this.#rootDir, '').replace(/^\//, '');

    const gitRevisionLogs = await new Command(
      'git',
      ['log', '--pretty=format:"%H|%an|%ae|%ad|%s"', '--date=iso-strict', '--no-merges', '--', this.#projectPath],
      {
        cwd: this.#rootDir,
        encoding: 'utf8',
      },
    ).execute();

    if (gitRevisionLogs.code !== 0) {
      throw new Error(gitRevisionLogs.stderr);
    }

    this.#gitRevisions = gitRevisionLogs.stdout
      .split('\n')
      .map((line) => {
        const [hash, authorName, authorEmail, date, message] = line.slice(1, -1).split('|');
        return {
          hash: hash!,
          authorName: authorName!,
          authorEmail: authorEmail!,
          date: new Date(date!),
          message: message!,
        } satisfies GitRevision;
      })
      .filter((r) => r.hash && r.date.toString() !== 'Invalid Date');
  }

  async #processNextRevision() {
    if (this.#abortController!.signal.aborted) {
      this.#abortController = undefined;
      return;
    }

    const revision = this.#processQueue!.shift() as CalculatedRevision | undefined;

    if (!revision) {
      this.#abortController = undefined;
      this.#emitter.emit('finished', void 0);
      return;
    }

    console.log(`Processing revision ${revision.hash}`);

    await Promise.all([this.loadProjectAtRevision(revision, false), this.loadProjectAtRevision(revision, true)]);

    try {
      if (revision.projectAtRevision && revision.projectBeforeRevision) {
        const changedGraphs: GraphId[] = [];
        for (const graph of Object.values(revision.projectAtRevision.graphs)) {
          const previousGraph = revision.projectBeforeRevision.graphs[graph.metadata!.id!];

          if (!previousGraph) {
            changedGraphs.push(graph.metadata!.id!);
            continue;
          }

          if (!isEqual(graph, previousGraph)) {
            changedGraphs.push(graph.metadata!.id!);
            continue;
          }
        }

        revision.changedGraphs = changedGraphs;
      } else if (revision.projectAtRevision && !revision.projectBeforeRevision) {
        revision.changedGraphs = Object.keys(revision.projectAtRevision.graphs) as GraphId[];
      } else {
        revision.changedGraphs = [];
      }
    } catch (err) {
      console.warn(err);
      revision.changedGraphs = [];
    }

    this.#processedRevisions.push(revision);

    this.#emitter.emit('processed', revision);

    await new Promise((resolve) => setTimeout(resolve, this.delay));

    this.#processNextRevision();
  }

  async loadProjectAtRevision(revision: CalculatedRevision, previousCommit: boolean) {
    try {
      const projectAtRevision = await new Command(
        'git',
        ['show', '--raw', `${revision.hash}${previousCommit ? '^' : ''}:${this.#relativePath}`],
        {
          cwd: this.#rootDir,
        },
      ).execute();

      if (projectAtRevision.code !== 0) {
        throw new Error(projectAtRevision.stderr);
      }

      const deserialized = await deserializeProjectAsync(projectAtRevision.stdout);

      if (previousCommit) {
        revision.projectBeforeRevision = deserialized;
      } else {
        revision.projectAtRevision = deserialized;
      }
    } catch (err) {
      console.warn(err);
    }
  }
}
