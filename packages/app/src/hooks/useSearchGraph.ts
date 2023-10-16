import { useRecoilValue, useSetRecoilState } from 'recoil';
import { useViewportBounds } from './useViewportBounds';
import { nodesState } from '../state/graph';
import { useEffect, useMemo } from 'react';
import { entries } from '../../../core/src/utils/typeSafety';
import { searchMatchingNodeIdsState, searchingGraphState } from '../state/graphBuilder';
import { useFuseSearch } from './useFuseSearch';
import { globalRivetNodeRegistry } from '@ironclad/rivet-core';
import { useFocusOnNodes } from './useFocusOnNodes';

export function useSearchGraph() {
  const graphNodes = useRecoilValue(nodesState);
  const setSearchMatchingNodes = useSetRecoilState(searchMatchingNodeIdsState);

  const focusOnNodes = useFocusOnNodes();

  const searchableNodes = useMemo(() => {
    return graphNodes.map((node) => {
      const joinedData = entries(node.data as object).map(([key, value]) => {
        return `${value}`;
      });

      const searchableNode = {
        title: node.title,
        description: node.description,
        id: node.id,
        joinedData: joinedData.join(' '),
        nodeType: globalRivetNodeRegistry.getDisplayName(node.type as any),
      };

      return searchableNode;
    });
  }, [graphNodes]);

  const searchState = useRecoilValue(searchingGraphState);

  const searchedNodes = useFuseSearch(searchableNodes, searchState.query, ['title', 'description', 'joinedData'], {
    enabled: searchState.searching,
    noInputEmptyList: true,
  });

  useEffect(() => {
    setSearchMatchingNodes(searchedNodes.map((n) => n.item.id));

    if (searchedNodes.length > 0) {
      focusOnNodes(searchedNodes.map((n) => n.item.id));
    }
  }, [searchState.query, searchState.searching]);
}
