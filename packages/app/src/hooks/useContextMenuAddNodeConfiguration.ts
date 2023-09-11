import { NodeUIData, globalRivetNodeRegistry } from '@ironclad/rivet-core';
import { ContextMenuItem } from './useContextMenuConfiguration';
import { useMemo } from 'react';
import { useBuiltInNodeImages } from './useBuiltInNodeImages';
import { useDependsOnPlugins } from './useDependsOnPlugins';

export const addContextMenuGroups = [
  {
    id: 'add-node-group:common',
    label: 'Common',
  },
  {
    id: 'add-node-group:text',
    label: 'Text',
  },
  {
    id: 'add-node-group:ai',
    label: 'AI',
  },
  {
    id: 'add-node-group:lists',
    label: 'Lists',
  },
  {
    id: 'add-node-group:numbers',
    label: 'Numbers',
  },
  {
    id: 'add-node-group:objects',
    label: 'Objects',
  },
  {
    id: 'add-node-group:data',
    label: 'Data',
  },
  {
    id: 'add-node-group:logic',
    label: 'Logic',
  },
  {
    id: 'add-node-group:input-output',
    label: 'Input/Output',
  },
  {
    id: 'add-node-group:advanced',
    label: 'Advanced',
  },
  {
    id: 'add-node-group:custom',
    label: 'Custom',
  },
] as const satisfies readonly ContextMenuItem[] & {
  items?: readonly ContextMenuItem[];
};

export function useContextMenuAddNodeConfiguration() {
  const constructors = globalRivetNodeRegistry.getNodeConstructors();
  const builtInImages = useBuiltInNodeImages();

  const uiData = constructors.map((constructor) => {
    const { type } = constructor.create();

    const uiData = constructor.getUIData
      ? constructor.getUIData()
      : ({
        group: 'Custom',
        contextMenuTitle: type,
        infoBoxTitle: type,
        infoBoxBody: '',
      } satisfies NodeUIData);

    return { type, uiData };
  });

  const plugins = useDependsOnPlugins();
  const groupsWithItems = useMemo(() => {
    const groups = ([
      ...addContextMenuGroups,
      ...plugins.flatMap(plugin => plugin.contextMenuGroups ?? [])
    ]).map((group) => {
      const items = uiData
        .filter((item) =>
          Array.isArray(item.uiData.group)
            ? item.uiData.group.includes(group.label)
            : item.uiData.group === group.label,
        )
        .map((item): ContextMenuItem => {
          const { type } = item;

          return {
            id: `add-node:${type}`,
            label: item.uiData.contextMenuTitle ?? type,
            data: type,
            infoBox: {
              title: item.uiData.infoBoxTitle ?? type,
              description: item.uiData.infoBoxBody ?? '',
              image: builtInImages[type as keyof typeof builtInImages] ?? undefined,
            },
          };
        });

      return { ...group, items };
    });

    return groups.filter((group) => group.items.length > 0);
  }, [builtInImages, uiData]);

  return groupsWithItems;
}
