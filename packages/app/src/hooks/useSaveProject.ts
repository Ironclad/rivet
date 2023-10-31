import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { loadedProjectState, openedProjectsState, projectState } from '../state/savedGraphs.js';
import { useSaveCurrentGraph } from './useSaveCurrentGraph.js';
import { produce } from 'immer';
import { toast, type Id as ToastId } from 'react-toastify';
import { ioProvider } from '../utils/globals.js';
import { trivetState } from '../state/trivet.js';

export function useSaveProject() {
  const saveGraph = useSaveCurrentGraph();
  const project = useRecoilValue(projectState);
  const [loadedProject, setLoadedProject] = useRecoilState(loadedProjectState);
  const { testSuites } = useRecoilValue(trivetState);
  const setOpenedProjects = useSetRecoilState(openedProjectsState);

  async function saveProject() {
    if (!loadedProject.loaded || !loadedProject.path) {
      return saveProjectAs();
    }

    const savedGraph = saveGraph(); // TODO stupid react rerendering... project will still be stale and not have this graph

    const newProject = produce(project, (draft) => {
      draft.graphs[savedGraph.metadata!.id!] = savedGraph;
    });

    // Large datasets can save slowly because of indexeddb, so show a "saving..." toast if it's a slow save
    let saving: ToastId | undefined;
    const savingTimeout = setTimeout(() => {
      saving = toast.info('Saving project');
    }, 500);

    await ioProvider.saveProjectDataNoPrompt(newProject, { testSuites }, loadedProject.path);

    if (saving != null) {
      toast.dismiss(saving);
    }
    clearTimeout(savingTimeout);

    toast.success('Project saved');
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

    // Large datasets can save slowly because of indexeddb, so show a "saving..." toast if it's a slow save
    let saving: ToastId | undefined;
    const savingTimeout = setTimeout(() => {
      saving = toast.info('Saving project');
    }, 500);

    const filePath = await ioProvider.saveProjectData(newProject, { testSuites });

    if (saving != null) {
      toast.dismiss(saving);
    }
    clearTimeout(savingTimeout);

    if (filePath) {
      toast.success('Project saved');
      setLoadedProject({
        loaded: true,
        path: filePath,
      });
      setOpenedProjects((projects) => ({
        ...projects,
        [project.metadata.id]: {
          project,
          fsPath: filePath,
        },
      }));
    }
  }

  return {
    saveProject,
    saveProjectAs,
  };
}
