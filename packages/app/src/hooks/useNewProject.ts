import { useSetAtom, useAtomValue } from 'jotai';
import {
  loadedProjectState,
  openedProjectsSortedIdsState,
  openedProjectsState,
  projectState,
  type OpenedProjectInfo,
} from '../state/savedGraphs.js';
import { emptyNodeGraph, type ProjectId } from '@ironclad/rivet-core';
import { graphState } from '../state/graph.js';
import { trivetState } from '../state/trivet';
import { blankProject } from '../utils/blankProject';
import { canvasPositionState } from '../state/graphBuilder';

export function useNewProject() {
  const setProject = useSetAtom(projectState);
  const setLoadedProject = useSetAtom(loadedProjectState);
  const currentIds = useAtomValue(openedProjectsSortedIdsState);
  const setOpenedProjectsSortedIds = useSetAtom(openedProjectsSortedIdsState);
  const setOpenedProjects = useSetAtom(openedProjectsState);

  const setGraphData = useSetAtom(graphState);
  const setTrivetData = useSetAtom(trivetState);
  const setPosition = useSetAtom(canvasPositionState);

  return ({
    title,
    description,
  }: {
    title?: string;
    description?: string;
  } = {}) => {
    const { data: _data, ...project } = blankProject();

    project.metadata.title = title || project.metadata.title;
    project.metadata.description = description || project.metadata.description;

    setProject(project);
    setLoadedProject({ loaded: false, path: '' });

    setPosition({ x: 0, y: 0, zoom: 1 });

    const newOpenedProjects: Record<ProjectId, OpenedProjectInfo> = {
      [project.metadata.id]: {
        project,
        fsPath: null,
      },
    };
    setOpenedProjects(newOpenedProjects);
    setOpenedProjectsSortedIds([...currentIds, project.metadata.id]);

    setGraphData(emptyNodeGraph());
    setTrivetData({
      runningTests: false,
      testSuites: [],
    });
  };
}
