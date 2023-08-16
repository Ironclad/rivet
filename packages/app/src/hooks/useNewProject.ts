import { useSetRecoilState } from 'recoil';
import { loadedProjectState, projectState } from '../state/savedGraphs.js';
import { nanoid } from 'nanoid';
import { Project, ProjectId, emptyNodeGraph } from '@ironclad/rivet-core';
import { graphState } from '../state/graph.js';
import { trivetState } from '../state/trivet';

export function blankProject(): Project {
  return {
    graphs: {},
    metadata: {
      id: nanoid() as ProjectId,
      title: 'Untitled Project',
      description: '',
    },
    plugins: [],
  };
}

export function useNewProject() {
  const setProject = useSetRecoilState(projectState);
  const setLoadedProject = useSetRecoilState(loadedProjectState);
  const setGraphData = useSetRecoilState(graphState);
  const setTrivetData = useSetRecoilState(trivetState);

  return () => {
    setProject(blankProject());
    setLoadedProject({ loaded: false, path: '' });
    setGraphData(emptyNodeGraph());
    setTrivetData({
      runningTests: false,
      testSuites: [],
    });
  };
}
