import { type ReplaceDatasetNode } from '@ironclad/rivet-core';
import { type NodeComponentDescriptor } from '../../hooks/useNodeTypes';
import { type FC } from 'react';
import { useDatasets } from '../../hooks/useDatasets';
import { useRecoilValue } from 'recoil';
import { projectState } from '../../state/savedGraphs';

export const ReplaceDatasetNodeBody: FC<{
  node: ReplaceDatasetNode;
}> = ({ node }) => {
  const project = useRecoilValue(projectState);
  const { datasets } = useDatasets(project.metadata.id);

  const dataset = datasets?.find((d) => d.id === node.data.datasetId);

  return (
    <div>
      <div>
        {node.data.useDatasetIdInput ? 'Dataset from input' : dataset ? dataset.name : 'Unknown or no dataset selected'}
      </div>
    </div>
  );
};

export const replaceDatasetNodeDescriptor: NodeComponentDescriptor<'replaceDataset'> = {
  Body: ReplaceDatasetNodeBody,
};
