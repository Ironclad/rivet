import TextField from '@atlaskit/textfield';
import { css } from '@emotion/react';
import { type DatasetMetadata } from '@ironclad/rivet-core';
import clsx from 'clsx';
import { type FC } from 'react';

const datasetStyles = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  cursor: pointer;

  &:hover {
    background-color: var(--grey-darkerish);
  }

  &.selected {
    background-color: var(--primary);
    color: var(--foreground-on-primary);
  }
`;

export const DatasetListItem: FC<{
  dataset: DatasetMetadata;
  isSelected: boolean;
  isRenaming: boolean;
  onSelect: () => void;
  onRename: () => void;
  onUpdate: (dataset: DatasetMetadata) => void;
}> = ({ dataset, isSelected, isRenaming, onSelect, onRename, onUpdate }) => {
  return (
    <div
      css={datasetStyles}
      className={clsx('dataset', { selected: isSelected })}
      key={dataset.id}
      onClick={onSelect}
      onDoubleClick={onRename}
      data-contextmenutype="dataset"
      data-datasetid={dataset.id}
    >
      <div className="name">
        {isRenaming ? (
          <TextField
            autoFocus
            defaultValue={dataset.name}
            onBlur={(e) => onUpdate({ ...dataset, name: (e.target as HTMLInputElement).value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onUpdate({ ...dataset, name: (e.target as HTMLInputElement).value });
              }
            }}
          />
        ) : (
          <div>{dataset.name}</div>
        )}
      </div>
      <div className="buttons"></div>
    </div>
  );
};
