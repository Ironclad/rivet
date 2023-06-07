import { useSetRecoilState } from 'recoil';
import { loadedProjectState, projectState } from '../state/savedGraphs';
import { loadProjectData } from '../utils/fileIO';
import { emptyNodeGraph } from '@ironclad/rivet-core';
import { graphState } from '../state/graph';

export function useLoadProject() {
  const setProject = useSetRecoilState(projectState);
  const setLoadedProjectState = useSetRecoilState(loadedProjectState);
  const setGraphData = useSetRecoilState(graphState);

  return () => {
    loadProjectData(({ project, path }) => {
      setProject(project);

      setGraphData(emptyNodeGraph());

      setLoadedProjectState({
        path,
        loaded: true,
      });
    });
  };
}
