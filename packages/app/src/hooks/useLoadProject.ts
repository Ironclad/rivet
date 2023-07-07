import { useSetRecoilState } from 'recoil';
import { loadedProjectState, projectState } from '../state/savedGraphs.js';
import { emptyNodeGraph } from '@ironclad/rivet-core';
import { graphState } from '../state/graph.js';
import { ioProvider } from '../utils/globals.js';

export function useLoadProject() {
  const setProject = useSetRecoilState(projectState);
  const setLoadedProjectState = useSetRecoilState(loadedProjectState);
  const setGraphData = useSetRecoilState(graphState);

  return () => {
    ioProvider.loadProjectData(({ project, path }) => {
      setProject(project);

      setGraphData(emptyNodeGraph());

      setLoadedProjectState({
        path,
        loaded: true,
      });
    });
  };
}
