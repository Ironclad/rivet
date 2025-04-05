import type { Opaque } from 'type-fest';
import { type GraphId, type NodeGraph } from './NodeGraph.js';
import { type PluginLoadSpec } from './PluginLoadSpec.js';

export type ProjectId = Opaque<string, 'ProjectId'>;

export type DataId = Opaque<string, 'DataId'>;

export type Project = {
  metadata: ProjectMetadata;

  plugins?: PluginLoadSpec[];

  graphs: Record<GraphId, NodeGraph>;

  data?: Record<DataId, string>;

  /** References to other projects. */
  references?: ProjectReference[];
};

export type ProjectMetadata = {
  id: ProjectId;
  title: string;
  description: string;
  mainGraphId?: GraphId;
  path?: string;
};

/** A reference to another project file. Project references cannot be cyclic. */
export type ProjectReference = {
  /** The ID of the project being referenced. */
  id: ProjectId;

  /** Paths to use to attempt to resolve the reference. */
  hintPaths?: string[];

  /** A human-readable title for the project. */
  title?: string;
};
