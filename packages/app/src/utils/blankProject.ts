import { type Project, type ProjectId, newId } from '@ironclad/rivet-core';

export function blankProject(): Project {
  return {
    graphs: {},
    metadata: {
      id: newId<ProjectId>(),
      title: 'Untitled Project',
      description: '',
    },
    plugins: [],
  };
}
