import { Opaque } from 'type-fest';
import { GraphId, NodeGraph } from './NodeGraph.js';
import { PluginLoadSpec } from './PluginLoadSpec.js';

export type ProjectId = Opaque<string, 'ProjectId'>;

export type Project = {
  metadata: {
    id: ProjectId;
    title: string;
    description: string;
  };

  plugins?: PluginLoadSpec[];

  graphs: Record<GraphId, NodeGraph>;
};
