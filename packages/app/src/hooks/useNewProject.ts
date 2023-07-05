import { useSetRecoilState } from 'recoil';
import { loadedProjectState, projectState } from '../state/savedGraphs';
import { nanoid } from 'nanoid';
import { Project, ProjectId, emptyNodeGraph } from '@ironclad/rivet-core';
import { graphState } from '../state/graph';

export function blankProject(): Project {
  return {
    graphs: {},
    metadata: {
      id: nanoid() as ProjectId,
      title: 'Untitled Project',
      description: '',
    },
  };
}

export function useNewProject() {
  const setProject = useSetRecoilState(projectState);
  const setLoadedProject = useSetRecoilState(loadedProjectState);
  const setGraphData = useSetRecoilState(graphState);

  return () => {
    setProject(blankProject());
    setLoadedProject({ loaded: false, path: '' });
    setGraphData(emptyNodeGraph());
  };
}
