import { useRecoilValue } from 'recoil';
import { projectState } from '../state/savedGraphs';
import { type GraphId, serializeProject } from '@ironclad/rivet-core';
import { type UseMutationResult, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCommunityApi } from '../utils/getCommunityApi';
import { type PutTemplateVersionBody } from '../utils/communityApi';
import { useDependsOnPlugins } from './useDependsOnPlugins';
import { toast } from 'react-toastify';

export type UseUploadNewTemplateVersionParams = {
  version: string;
  description: string;
  versionDescription: string;
  graphsToInclude: GraphId[];
};

export function useUploadNewTemplateVersion({
  templateId,
  onCompleted,
}: {
  templateId: string;
  onCompleted: () => void;
}): UseMutationResult<void, Error, UseUploadNewTemplateVersionParams, unknown> {
  const project = useRecoilValue(projectState);
  const plugins = useDependsOnPlugins();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (params: UseUploadNewTemplateVersionParams) => {
      const serializedProject = serializeProject(project);

      const putTemplateVersionUrl = getCommunityApi('/templates/:templateId/version/:version');

      const versionResponse = await fetch(
        putTemplateVersionUrl.replace(':templateId', templateId).replace(':version', params.version),
        {
          credentials: 'include',
          method: 'PUT',
          body: JSON.stringify({
            descriptionMarkdown: params.description,
            versionDescriptionMarkdown: params.versionDescription,
            plugins: plugins.map((plugin) => plugin.id),
            serializedProject: serializedProject as string,
          } satisfies PutTemplateVersionBody),
        },
      );

      if (!versionResponse.ok) {
        throw new Error(`Failed to upload template: ${await versionResponse.text()}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-templates'] });
    },
    onError: (error) => {
      toast.error(`Failed to upload template: ${error.message}`);
    },
    onMutate: () => {
      onCompleted();
    },
  });

  return mutation;
}
