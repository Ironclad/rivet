import { FC } from 'react';
import { css } from '@emotion/react';
import { PopNode } from '@ironclad/nodai-core';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';

type PopNodeBodyProps = {
  node: PopNode;
};

const styles = css`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const PopNodeBody: FC<PopNodeBodyProps> = ({ node }) => {
  return (
    <div css={styles}>
      <div>Array Node</div>
    </div>
  );
};

export type PopNodeEditorProps = {
  node: PopNode;
  onChange?: (node: PopNode) => void;
};

const container = css`
  font-family: 'Roboto', sans-serif;
  color: var(--foreground);
  background-color: var(--grey-darker);

  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const PopNodeEditor: FC<PopNodeEditorProps> = ({ node, onChange }) => {
  return (
    <div css={container}>
      <div className="row">
        <label className="label">Pop Node</label>
      </div>
    </div>
  );
};

export const popNodeDescriptor: NodeComponentDescriptor<'pop'> = {
  Body: PopNodeBody,
  Output: undefined,
  Editor: PopNodeEditor,
};
