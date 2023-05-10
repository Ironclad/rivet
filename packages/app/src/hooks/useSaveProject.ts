import { useRecoilState, useRecoilValue } from 'recoil';
import { loadedProjectState, projectState } from '../state/savedGraphs';
import { saveProjectData, saveProjectDataNoPrompt } from '../utils/fileIO';
import { useSaveCurrentGraph } from './useSaveCurrentGraph';
import produce from 'immer';

export function useSaveProject() {
  const saveGraph = useSaveCurrentGraph();
  const project = useRecoilValue(projectState);
  const [loadedProject, setLoadedProject] = useRecoilState(loadedProjectState);

  async function saveProject() {
    if (!loadedProject.loaded || !loadedProject.path) {
      return saveProjectAs();
    }

    const savedGraph = saveGraph(); // TODO stupid react rerendering... project will still be stale and not have this graph

    const newProject = produce(project, (draft) => {
      draft.graphs[savedGraph.metadata!.id!] = savedGraph;
    });

    await saveProjectDataNoPrompt(newProject, loadedProject.path);
    setLoadedProject({
      loaded: true,
      path: loadedProject.path,
    });
  }

  async function saveProjectAs() {
    const savedGraph = saveGraph(); // TODO stupid react rerendering... project will still be stale and not have this graph

    const newProject = produce(project, (draft) => {
      draft.graphs[savedGraph.metadata!.id!] = savedGraph;
    });

    const filePath = await saveProjectData(newProject);

    if (filePath) {
      setLoadedProject({
        loaded: true,
        path: filePath,
      });
    }
  }

  return {
    saveProject,
    saveProjectAs,
  };
}
