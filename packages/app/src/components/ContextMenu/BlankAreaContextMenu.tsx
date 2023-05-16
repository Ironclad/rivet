import { NodeType } from '@ironclad/nodai-core';
import { useStableCallback } from '../../hooks/useStableCallback';
import { ContextMenuProps } from './ContextMenu';
import { FC } from 'react';
import { AddContextMenuItem } from './AddContextMenuItem';

export const BlankAreaContextMenu: FC<Pick<ContextMenuProps, 'data' | 'onMenuItemSelected'>> = ({
  onMenuItemSelected,
}) => {
  const handleAdd = useStableCallback((nodeType: NodeType) => {
    onMenuItemSelected?.(`Add:${nodeType}`);
  });

  return (
    <>
      <AddContextMenuItem onAdd={handleAdd} />
    </>
  );
};
