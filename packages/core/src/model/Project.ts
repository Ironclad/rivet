import type { Opaque } from 'type-fest';
import { type GraphId, type NodeGraph } from './NodeGraph.js';
import { type PluginLoadSpec } from './PluginLoadSpec.js';

export type ProjectId = Opaque<string, 'ProjectId'>;

export type DataId = Opaque<string, 'DataId'>;

export type Project = {
  metadata: {
    id: ProjectId;
    title: string;
    description: string;
    mainGraphId?: GraphId;
  };

  plugins?: PluginLoadSpec[];

  graphs: Record<GraphId, NodeGraph>;

  data?: Record<DataId, string>;
};
