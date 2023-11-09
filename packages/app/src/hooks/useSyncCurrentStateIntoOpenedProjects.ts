import { useEffect } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import {
  loadedProjectState,
  openedProjectsSortedIdsState,
  openedProjectsState,
  projectState,
} from '../state/savedGraphs';
import { graphState } from '../state/graph';

export function useSyncCurrentStateIntoOpenedProjects() {
  const [openedProjects, setOpenedProjects] = useRecoilState(openedProjectsState);
  const [openedProjectsSortedIds, setOpenedProjectsSortedIds] = useRecoilState(openedProjectsSortedIdsState);

  const currentProject = useRecoilValue(projectState);
  const loadedProject = useRecoilValue(loadedProjectState);
  const currentGraph = useRecoilValue(graphState);

  // Make sure current opened project is in opened projects
  useEffect(() => {
    if (currentProject && openedProjects[currentProject.metadata.id] == null) {
      setOpenedProjects((openedProjects) => ({
        ...openedProjects,
        [currentProject.metadata.id]: {
          project: currentProject,
          fsPath: null,
        },
      }));
    }

    if (loadedProject.path && !openedProjects[currentProject.metadata.id]?.fsPath) {
      setOpenedProjects((openedProjects) => ({
        ...openedProjects,
        [currentProject.metadata.id]: {
          project: currentProject,
          fsPath: loadedProject.path,
        },
      }));
    }

    if (currentProject && openedProjectsSortedIds.includes(currentProject.metadata.id) === false) {
      setOpenedProjectsSortedIds((ids) => [...ids, currentProject.metadata.id]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [currentProject, loadedProject, setOpenedProjects]);

  // Sync current project into opened projects
  useEffect(() => {
    setOpenedProjects((openedProjects) => ({
      ...openedProjects,
      [currentProject.metadata.id]: {
        ...openedProjects[currentProject.metadata.id],
        project: currentProject,
      },
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [currentProject]);

  // Sync current graph into opened projects
  useEffect(() => {
    if (currentGraph.metadata?.id != null && currentProject.graphs[currentGraph.metadata.id]) {
      setOpenedProjects((openedProjects) => ({
        ...openedProjects,
        [currentProject.metadata.id]: {
          ...openedProjects[currentProject.metadata.id],
          project: {
            ...currentProject,
            graphs: {
              // Sync current graph into opened projects as well, so that when you make changes, nav away, nav back, your changes are still there
              ...currentProject.graphs,
              [currentGraph.metadata!.id!]: currentGraph,
            },
          },
          openedGraph: currentGraph.metadata!.id!,
        },
      }));
    }
    // Changes a lot, hopefully okay
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [currentGraph]);

  // Make sure opened projects sorted ids are in sync with opened projects
  useEffect(() => {
    if (openedProjectsSortedIds.some((id) => openedProjects[id] == null)) {
      setOpenedProjectsSortedIds((ids) => ids.filter((id) => openedProjects[id] != null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [openedProjects, openedProjectsSortedIds]);
}
