import { useEffect } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import {
  loadedProjectState,
  openedProjectsSortedIdsState,
  openedProjectsState,
  projectState,
} from '../state/savedGraphs';
import { graphMetadataState } from '../state/graph';

export function useSyncCurrentStateIntoOpenedProjects() {
  const [openedProjects, setOpenedProjects] = useRecoilState(openedProjectsState);
  const [openedProjectsSortedIds, setOpenedProjectsSortedIds] = useRecoilState(openedProjectsSortedIdsState);

  const currentProject = useRecoilValue(projectState);
  const loadedProject = useRecoilValue(loadedProjectState);
  const currentGraph = useRecoilValue(graphMetadataState);

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
  }, [currentProject]);

  // Sync current graph into opened projects
  useEffect(() => {
    if (currentGraph?.id != null && currentProject.graphs[currentGraph.id]) {
      setOpenedProjects((openedProjects) => ({
        ...openedProjects,
        [currentProject.metadata.id]: {
          ...openedProjects[currentProject.metadata.id],
          openedGraph: currentGraph!.id!,
        },
      }));
    }
  }, [currentGraph]);

  // Make sure opened projects sorted ids are in sync with opened projects
  useEffect(() => {
    if (openedProjectsSortedIds.some((id) => openedProjects[id] == null)) {
      setOpenedProjectsSortedIds((ids) => ids.filter((id) => openedProjects[id] != null));
    }
  }, [openedProjects, openedProjectsSortedIds]);
}
