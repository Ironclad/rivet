import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { loadedProjectState, openedProjectsState, projectState } from '../state/savedGraphs.js';
import { useSaveCurrentGraph } from './useSaveCurrentGraph.js';
import { produce } from 'immer';
import { toast, type Id as ToastId } from 'react-toastify';
import { ioProvider } from '../utils/globals.js';
import { trivetState } from '../state/trivet.js';

export function useSaveProject() {
  const saveGraph = useSaveCurrentGraph();
  const project = useAtomValue(projectState);
  const [loadedProject, setLoadedProject] = useAtom(loadedProjectState);
  const { testSuites } = useAtomValue(trivetState);
  const setOpenedProjects = useSetAtom(openedProjectsState);

  async function saveProject() {
    if (!loadedProject.loaded || !loadedProject.path) {
      return saveProjectAs();
    }

    const savedGraph = saveGraph();

    const newProject = savedGraph
      ? produce(project, (draft) => {
          draft.graphs[savedGraph.metadata!.id!] = savedGraph;
        })
      : project;

    // Large datasets can save slowly because of indexeddb, so show a "saving..." toast if it's a slow save
    let saving: ToastId | undefined;
    const savingTimeout = setTimeout(() => {
      saving = toast.info('Saving project');
    }, 500);

    try {
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
    } catch (cause) {
      clearTimeout(savingTimeout);
      toast.error('Failed to save project');
    }
  }

  async function saveProjectAs() {
    const savedGraph = saveGraph();

    const newProject = savedGraph
      ? produce(project, (draft) => {
          draft.graphs[savedGraph.metadata!.id!] = savedGraph;
        })
      : project;

    // Large datasets can save slowly because of indexeddb, so show a "saving..." toast if it's a slow save
    let saving: ToastId | undefined;
    const savingTimeout = setTimeout(() => {
      saving = toast.info('Saving project');
    }, 500);

    try {
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
        setOpenedProjects({
          [project.metadata.id]: {
            project,
            fsPath: filePath,
          },
        });
      }
    } catch (cause) {
      clearTimeout(savingTimeout);
      toast.error('Failed to save project');
    }
  }

  return {
    saveProject,
    saveProjectAs,
  };
}
