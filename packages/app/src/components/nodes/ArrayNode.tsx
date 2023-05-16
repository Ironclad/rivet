import { FC } from 'react';
import { css } from '@emotion/react';
import { ArrayNode } from '@ironclad/nodai-core';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';

type ArrayNodeBodyProps = {
  node: ArrayNode;
};

const styles = css`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const ArrayNodeBody: FC<ArrayNodeBodyProps> = ({ node }) => {
  return (
    <div css={styles}>
      <div>Array Node</div>
    </div>
  );
};

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
  Body: ArrayNodeBody,
  Output: undefined,
  Editor: ArrayNodeEditor,
};
