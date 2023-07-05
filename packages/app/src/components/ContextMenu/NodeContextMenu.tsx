import { FC } from 'react';
import { ContextMenuItem, ContextMenuProps } from './ContextMenu';
import { useStableCallback } from '../../hooks/useStableCallback';
import { ReactComponent as DeleteIcon } from 'majesticons/line/delete-bin-line.svg';
import { ReactComponent as SettingsCogIcon } from 'majesticons/line/settings-cog-line.svg';
import { ReactComponent as DuplicateIcon } from 'majesticons/line/image-multiple-line.svg';
import { useRecoilValue } from 'recoil';
import { nodesByIdState, nodesState } from '../../state/graph';
import { NodeId, Nodes } from '@ironclad/rivet-core';

export const NodeContextMenu: FC<Pick<ContextMenuProps, 'data' | 'onMenuItemSelected'>> = ({
  data,
  onMenuItemSelected,
}) => {
  const nodeId = data?.element.dataset.nodeId;
  const nodesById = useRecoilValue(nodesByIdState);
  const node = nodeId ? nodesById[nodeId as NodeId] : undefined;

  const editNode = useStableCallback(() => {
    onMenuItemSelected?.(`Edit:${nodeId}`);
  });

  const deleteNode = useStableCallback(() => {
    onMenuItemSelected?.(`Delete:${nodeId}`);
  });

  const duplicateNode = useStableCallback(() => {
    onMenuItemSelected?.(`Duplicate:${nodeId}`);
  });

  const factorIntoSubgraph = useStableCallback(() => {
    onMenuItemSelected?.(`FactorIntoSubgraph`);
  });

  if (!node) {
    return null;
  }

  return (
    <>
      {node.type === 'subGraph' && (
        <ContextMenuItem
          label={
            <>
              <SettingsCogIcon /> Go To Subgraph
            </>
          }
          onClick={() => onMenuItemSelected?.(`GoToSubgraph:${nodeId}`)}
        />
      )}
      <ContextMenuItem
        label={
          <>
            <SettingsCogIcon /> Edit
          </>
        }
        onClick={editNode}
      />
      <ContextMenuItem
        label={
          <>
            <DuplicateIcon /> Duplicate
          </>
        }
        onClick={duplicateNode}
      />
      <ContextMenuItem
        label={
          <>
            <DuplicateIcon /> Create Subgraph
          </>
        }
        onClick={factorIntoSubgraph}
      />
      <ContextMenuItem
        label={
          <>
            <DeleteIcon /> Delete
          </>
        }
        onClick={deleteNode}
      />
    </>
  );
};
