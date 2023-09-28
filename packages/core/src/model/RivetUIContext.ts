import { type ChartNode, type DatasetProvider, type NodeGraph, type Project, type Settings } from '../index.js';

/** Context accessible to UI functions such as getEditors() and getBody(). */
export type RivetUIContext = {
  /** The settings configured in the UI. */
  settings: Settings;

  /** The selected executor. */
  executor: 'nodejs' | 'browser';

  /** The provider that can control datasets. */
  datasetProvider: DatasetProvider;

  /** The current project loaded in the UI. */
  project: Project;

  /** The current graph selected in the UI. */
  graph?: NodeGraph;

  /** The current node selected in the UI. */
  node?: ChartNode;

  /** Gets a string plugin config value from the settings, falling back to a specified environment variable if set. */
  getPluginConfig(name: string): string | undefined;
};
