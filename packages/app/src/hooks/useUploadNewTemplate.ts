import { useRecoilValue } from 'recoil';
import { projectState } from '../state/savedGraphs';
import { type GraphId, serializeProject } from '@ironclad/rivet-core';
import { type UseMutationResult, useMutation } from '@tanstack/react-query';
import { getCommunityApi } from '../utils/getCommunityApi';
import { templateResponseChecker, type PostTemplateBody, type PutTemplateVersionBody } from '../utils/communityApi';
import { useDependsOnPlugins } from './useDependsOnPlugins';
import { toast } from 'react-toastify';

export function useUploadNewTemplate({ onCompleted }: { onCompleted: () => void }): UseMutationResult<
  void,
  Error,
  {
    templateName: string;
    version: string;
    description: string;
    graphsToInclude: GraphId[];
  },
  unknown
> {
  const project = useRecoilValue(projectState);
  const plugins = useDependsOnPlugins();

  const mutation = useMutation({
    mutationFn: async (params: {
      templateName: string;
      version: string;
      description: string;
      graphsToInclude: GraphId[];
    }) => {
      const serializedProject = serializeProject(project);

      const postTemplateUrl = getCommunityApi('/templates');
      const putTemplateVersionUrl = getCommunityApi('/templates/:templateId/version/:version');

      const postTemplateResponse = await fetch(postTemplateUrl, {
        credentials: 'include',
        method: 'POST',
        body: JSON.stringify({
          name: params.templateName,
          tags: [],
        } satisfies PostTemplateBody),
      });

      if (!postTemplateResponse.ok) {
        throw new Error(`Failed to upload template: ${await postTemplateResponse.text()}`);
      }

      const postTemplateJson = templateResponseChecker(await postTemplateResponse.json());

      if (postTemplateJson.type === 'failure') {
        throw new Error(postTemplateJson.message);
      }

      const versionResponse = await fetch(
        putTemplateVersionUrl.replace(':templateId', postTemplateJson.value.id).replace(':version', params.version),
        {
          credentials: 'include',
          method: 'PUT',
          body: JSON.stringify({
            descriptionMarkdown: params.description,
            versionDescriptionMarkdown: params.description,
            plugins: plugins.map((plugin) => plugin.id),
            serializedProject: serializedProject as string,
          } satisfies PutTemplateVersionBody),
        },
      );

      if (!versionResponse.ok) {
        throw new Error(`Failed to upload template: ${await versionResponse.text()}`);
      }
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
