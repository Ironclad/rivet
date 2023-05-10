import { useSetRecoilState } from 'recoil';
import { loadedProjectState, projectState } from '../state/savedGraphs';
import { nanoid } from 'nanoid';
import { ProjectId, emptyNodeGraph } from '@ironclad/nodai-core';
import { graphState } from '../state/graph';

export function useNewProject() {
  const setProject = useSetRecoilState(projectState);
  const setLoadedProject = useSetRecoilState(loadedProjectState);
  const setGraphData = useSetRecoilState(graphState);

  return () => {
    setProject({
      graphs: {},
      metadata: {
        id: nanoid() as ProjectId,
        title: 'Untitled Project',
        description: '',
      },
    });
    setLoadedProject({ loaded: false, path: '' });
    setGraphData(emptyNodeGraph());
  };
}
