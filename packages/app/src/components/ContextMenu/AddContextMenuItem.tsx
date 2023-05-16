import { FC } from 'react';
import { NodeType } from '@ironclad/nodai-core';
import { ContextMenuItem } from './ContextMenu';
import { useAddContextMenuGroups } from '../../hooks/useAddContextMenuGroups';

export const AddContextMenuItem: FC<{ onAdd: (nodeType: NodeType) => void }> = ({ onAdd }) => {
  const addGroups = useAddContextMenuGroups();

  return (
    <ContextMenuItem label="Add" hasSubMenu={true}>
      {addGroups.map((group) => (
        <ContextMenuItem label={group.label} key={group.label}>
          {group.items.map((item) => (
            <ContextMenuItem label={item.label} key={item.nodeType} onClick={() => onAdd(item.nodeType)} />
          ))}
        </ContextMenuItem>
      ))}
    </ContextMenuItem>
  );
};
