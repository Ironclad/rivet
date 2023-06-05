import { FC } from 'react';
import Select from '@atlaskit/select';
import { Field } from '@atlaskit/form';
import { css } from '@emotion/react';
import { useRecoilValue } from 'recoil';
import { lastRunData } from '../../state/dataFlow';
import { RenderDataValue } from '../RenderDataValue';
import { projectState } from '../../state/savedGraphs';
import { entries, values } from '../../utils/typeSafety';
import { nanoid } from 'nanoid';
import { GraphId, SubGraphNode } from '@ironclad/nodai-core';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';
import { orderBy } from 'lodash-es';
import Toggle from '@atlaskit/toggle';

export type SubGraphNodeBodyProps = {
  node: SubGraphNode;
};

export const SubGraphNodeBody: FC<SubGraphNodeBodyProps> = ({ node }) => {
  const project = useRecoilValue(projectState);
  const selectedGraph = project.graphs[node.data.graphId];
  const selectedGraphName = selectedGraph?.metadata?.name ?? node.data.graphId;

  return (
    <div>
      <div>{selectedGraphName}</div>
    </div>
  );
};

export type SubGraphNodeEditorProps = {
  node: SubGraphNode;
  onChange?: (node: SubGraphNode) => void;
};

const editorCss = css`
  display: grid;
  grid-template-columns: 1fr;
  align-items: stretch;
  width: 100%;
  align-content: start;
  align-items: center;
  column-gap: 16px;
`;

export const SubGraphNodeEditor: FC<SubGraphNodeEditorProps> = ({ node, onChange }) => {
  const project = useRecoilValue(projectState);

  const graphOptions = orderBy(
    values(project.graphs).map((graph) => ({
      label: graph.metadata?.name ?? graph.metadata?.id ?? 'Unknown Graph',
      value: graph.metadata?.id ?? (nanoid() as GraphId),
    })),
    'label',
  );

  const selectedOption = graphOptions.find((option) => option.value === node.data.graphId);

  return (
    <div css={editorCss}>
      <Field name="data-type" label="Graph">
        {({ fieldProps }) => (
          <Select
            {...fieldProps}
            options={graphOptions}
            value={selectedOption}
            onChange={(selected) =>
              onChange?.({
                ...node,
                title: selected?.label ?? 'Unknown Graph',
                data: {
                  ...node.data,
                  graphId: selected?.value ?? ('' as GraphId),
                },
              })
            }
          />
        )}
      </Field>
    </div>
  );
};

export const subgraphNodeDescriptor: NodeComponentDescriptor<'subGraph'> = {
  Body: SubGraphNodeBody,
  Output: undefined,
  Editor: SubGraphNodeEditor,
};
