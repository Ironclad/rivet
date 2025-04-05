import { useAtomValue, useSetAtom } from 'jotai';
import { loadedProjectState, projectState, referencedProjectsState } from '../state/savedGraphs';
import { useCallback } from 'react';
import { TauriProjectReferenceLoader } from '../model/TauriProjectReferenceLoader';
import { type Project, type ProjectId } from '@ironclad/rivet-core';
import useAsyncEffect from 'use-async-effect';
import { toast } from 'react-toastify';

export function useReloadProjectReferences() {
  const project = useAtomValue(projectState);
  const loadedProject = useAtomValue(loadedProjectState);

  const setReferencedProjects = useSetAtom(referencedProjectsState);

  const reloadReferences = useCallback(async () => {
    try {
      const loader = new TauriProjectReferenceLoader();

      const collectedProjects: Record<ProjectId, Project> = {};

      for (const reference of project.references ?? []) {
        const refProject = await loader.loadProject(loadedProject.path ?? undefined, reference);
        collectedProjects[reference.id] = refProject;
      }

      setReferencedProjects(collectedProjects);
    } catch (err) {
      toast.error('Error reloading project references');
    }
  }, [project, loadedProject, setReferencedProjects]);

  useAsyncEffect(async () => {
    await reloadReferences();
  }, [project, loadedProject, reloadReferences]);

  return reloadReferences;
}
