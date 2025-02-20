import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
import { entries } from '../../../core/src/utils/typeSafety';
import { useFuseSearch } from './useFuseSearch';
import { type GraphId, globalRivetNodeRegistry } from '@ironclad/rivet-core';
import { useNodeTypes } from './useNodeTypes';
import { useDependsOnPlugins } from './useDependsOnPlugins';
import { projectState } from '../state/savedGraphs';

export type SearchableItem = {
  type: 'node';
  id: string;
  title: string;
  description: string;
  joinedData: string;
  containerGraph: GraphId;
  nodeType: string;
};

export type RangeTuple = [number, number];

export type FuseResultMatch = {
  indices: ReadonlyArray<RangeTuple>;
  key?: string;
  refIndex?: number;
  value?: string;
  score?: number;
};

export type SearchedItem = {
  item: SearchableItem;
  matches: readonly FuseResultMatch[] | undefined;
};

export function useSearchProject(query: string, enabled: boolean): SearchedItem[] {
  const project = useAtomValue(projectState);

  useDependsOnPlugins();

  const nodeTypes = useNodeTypes();

  const searchableNodes = useMemo(() => {
    const graphs = Object.values(project.graphs);

    const items: SearchableItem[] = [];

    for (const graph of graphs) {
      const graphNodes = graph.nodes;

      for (const node of graphNodes) {
        const joinedData = entries(node.data as object).map(([key, value]) => {
          return `${value}`;
        });

        const isKnownNodeType = node.type in nodeTypes;

        const searchableNode: SearchableItem = {
          type: 'node',
          title: node.title,
          description: node.description ?? '',
          id: node.id,
          joinedData: joinedData.join(' '),
          containerGraph: graph.metadata!.id!,
          nodeType: isKnownNodeType ? globalRivetNodeRegistry.getDisplayName(node.type as any) : '',
        };

        items.push(searchableNode);
      }
    }

    return items;
  }, [nodeTypes, project]);

  const searchedNodes = useFuseSearch(
    searchableNodes,
    query,
    ['id', 'title', 'description', 'joinedData', 'nodeType'],
    {
      enabled,
      noInputEmptyList: true,
    },
  );

  return searchedNodes.map((node): SearchedItem => {
    return {
      item: node.item,
      matches: node.matches,
    };
  });
}
