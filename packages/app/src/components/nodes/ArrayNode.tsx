import { FC } from 'react';
import { css } from '@emotion/react';
import { ArrayNode } from '@ironclad/nodai-core';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';

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
  return (
    <div css={container}>
      <div className="row">
        <label className="label">Array Node</label>
      </div>
    </div>
  );
};

export const arrayNodeDescriptor: NodeComponentDescriptor<'array'> = {
  Body: undefined,
  Output: undefined,
  Editor: ArrayNodeEditor,
};
