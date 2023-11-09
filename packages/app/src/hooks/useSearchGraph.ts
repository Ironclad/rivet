import { useRecoilValue, useSetRecoilState } from 'recoil';
import { nodesState } from '../state/graph';
import { useEffect, useMemo } from 'react';
import { entries } from '../../../core/src/utils/typeSafety';
import { searchMatchingNodeIdsState, searchingGraphState } from '../state/graphBuilder';
import { useFuseSearch } from './useFuseSearch';
import { globalRivetNodeRegistry } from '@ironclad/rivet-core';
import { useFocusOnNodes } from './useFocusOnNodes';
import { useNodeTypes } from './useNodeTypes';
import { useDependsOnPlugins } from './useDependsOnPlugins';

export function useSearchGraph() {
  const graphNodes = useRecoilValue(nodesState);
  const setSearchMatchingNodes = useSetRecoilState(searchMatchingNodeIdsState);

  useDependsOnPlugins();
  const focusOnNodes = useFocusOnNodes();
  const nodeTypes = useNodeTypes();

  const searchableNodes = useMemo(() => {
    return graphNodes.map((node) => {
      const joinedData = entries(node.data as object).map(([key, value]) => {
        return `${value}`;
      });

      const isKnownNodeType = node.type in nodeTypes;

      const searchableNode = {
        title: node.title,
        description: node.description,
        id: node.id,
        joinedData: joinedData.join(' '),
        nodeType: isKnownNodeType ? globalRivetNodeRegistry.getDisplayName(node.type as any) : '',
      };

      return searchableNode;
    });
  }, [graphNodes, nodeTypes]);

  const searchState = useRecoilValue(searchingGraphState);

  const searchedNodes = useFuseSearch(
    searchableNodes,
    searchState.query,
    ['title', 'description', 'joinedData', 'nodeType'],
    {
      enabled: searchState.searching,
      noInputEmptyList: true,
    },
  );

  useEffect(() => {
    setSearchMatchingNodes(searchedNodes.map((n) => n.item.id));

    if (searchedNodes.length > 0) {
      focusOnNodes(searchedNodes.map((n) => n.item.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bleh
  }, [searchState.query, searchState.searching]);
}
