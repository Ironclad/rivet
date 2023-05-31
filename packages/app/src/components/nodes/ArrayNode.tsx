import { FC } from 'react';
import { css } from '@emotion/react';
import { ArrayNode, ArrayNodeData } from '@ironclad/nodai-core';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';
import Toggle from '@atlaskit/toggle';

export type ArrayNodeEditorProps = {
  node: ArrayNode;
  onChange?: (node: ArrayNode) => void;
};

const container = css`
  font-family: 'Roboto', sans-serif;
  color: var(--foreground);
  background-color: var(--grey-darker);

  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const ArrayNodeEditor: FC<ArrayNodeEditorProps> = ({ node, onChange }) => {
  const handleToggleChange = (param: keyof ArrayNodeData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.({
      ...node,
      data: { ...node.data, [param]: e.target.checked },
    });
  };

  return (
    <div css={container}>
      <div className="row">
        <label htmlFor="useFunctionNameInput">Flatten:</label>
        <Toggle id="useFunctionNameInput" isChecked={node.data.flatten} onChange={handleToggleChange('flatten')} />
      </div>
    </div>
  );
};

export const arrayNodeDescriptor: NodeComponentDescriptor<'array'> = {
  Body: undefined,
  Output: undefined,
  Editor: ArrayNodeEditor,
};
