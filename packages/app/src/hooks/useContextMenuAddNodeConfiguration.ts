import { type NodeUIData, getError, globalRivetNodeRegistry } from '@ironclad/rivet-core';
import { type ContextMenuItem } from './useContextMenuConfiguration';
import { useMemo, useState } from 'react';
import { useBuiltInNodeImages } from './useBuiltInNodeImages';
import { useDependsOnPlugins } from './useDependsOnPlugins';
import { useGetRivetUIContext } from './useGetRivetUIContext';
import useAsyncEffect from 'use-async-effect';
import { toast } from 'react-toastify';
import { isNotNull } from '../utils/genericUtilFunctions';
import { orderBy, uniqBy } from 'lodash-es';
import { useRecoilValue } from 'recoil';
import { nodeConstructorsState } from '../state/graph';

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
  const constructors = useRecoilValue(nodeConstructorsState);
  const builtInImages = useBuiltInNodeImages();
  const getUIContext = useGetRivetUIContext();

  const [uiData, setUiData] = useState<readonly { type: string; uiData: NodeUIData }[]>([]);

  useAsyncEffect(async () => {
    const context = await getUIContext({});

    const uiData = (
      await Promise.all(
        constructors.map(async (constructor) => {
          try {
            const { type } = constructor.create();

            const uiData = constructor.getUIData // eslint-disable-next-line @typescript-eslint/await-thenable -- it is thenable you dummy
              ? await constructor.getUIData(context)
              : ({
                  group: 'Custom',
                  contextMenuTitle: type,
                  infoBoxTitle: type,
                  infoBoxBody: '',
                } satisfies NodeUIData);

            return { type, uiData };
          } catch (err) {
            toast.error(`Error getting UI data for node type ${constructor.name}: ${getError(err).message}`);
            return undefined;
          }
        }),
      )
    ).filter(isNotNull);

    setUiData(uiData);
  }, [constructors, getUIContext]);

  const plugins = useDependsOnPlugins();
  const groupsWithItems = useMemo(() => {
    const allGroups = uniqBy(
      [...addContextMenuGroups, ...plugins.flatMap((plugin) => plugin.contextMenuGroups ?? [])],
      (g) => g.id,
    );

    const groups = allGroups.map((group) => {
      let items = uiData
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

      items = orderBy(items, (item) => item.label);

      return { ...group, items };
    });

    return groups.filter((group) => group.items.length > 0);
  }, [builtInImages, uiData, plugins]);

  return groupsWithItems;
}
