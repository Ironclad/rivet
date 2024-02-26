import { type ComponentType, useMemo } from 'react';
import { useContextMenuAddNodeConfiguration } from './useContextMenuAddNodeConfiguration.js';
import DeleteIcon from 'majesticons/line/delete-bin-line.svg?react';
import SettingsCogIcon from 'majesticons/line/settings-cog-line.svg?react';
import DuplicateIcon from 'majesticons/line/image-multiple-line.svg?react';
import PlayIcon from 'majesticons/line/play-circle-line.svg?react';
import CopyIcon from '../assets/icons/copy-icon.svg?react';
import PasteIcon from '../assets/icons/paste-icon.svg?react';
import PlusIcon from 'majesticons/line/plus-line.svg?react';
import { type NodeId } from '@ironclad/rivet-core';
import { useRecoilValue } from 'recoil';
import { selectedNodesState } from '../state/graphBuilder.js';
import { useContextMenuCommands } from './useContextMenuCommands.js';
import { clipboardState } from '../state/clipboard';

export type ContextMenuConfig = {
  contexts: ContextMenuContextConfig;
  commands: ContextMenuItem[];
};

export type ContextMenuContextConfig = {
  [key: string]: ContextMenuContextConfigContext;
};

export type ContextMenuContextConfigContext<Context = unknown> = {
  contextType: Context;
  items: readonly ContextMenuItem<Context>[];
};

export type ContextMenuItem<Context = unknown, Data = unknown> = {
  id: string;
  label: string;
  subLabel?: string;
  icon?: ComponentType;
  data?: Data | ((context: Context) => Data);
  conditional?: (context: Context) => boolean;
  items?: readonly ContextMenuItem<Context>[];
  infoBox?: {
    title: string;
    description: string;
    image?: string;
  };
};

export type ContextMenuConfiguration = ReturnType<typeof useContextMenuConfiguration>;

const type = <T>() => undefined! as T;

export function useContextMenuConfiguration() {
  const addMenuConfig = useContextMenuAddNodeConfiguration();
  const commands = useContextMenuCommands();
  const selectedNodeIds = useRecoilValue(selectedNodesState);
  const clipboard = useRecoilValue(clipboardState);

  const config = useMemo(
    () =>
      ({
        // Defines the "contexts" that the context menu can show, i.e. what you've right clicked on.
        contexts: {
          node: {
            contextType: type<{
              nodeType: string;
              nodeId: NodeId;
            }>(),
            items: [
              {
                id: 'node-copy',
                label: 'Copy',
                icon: CopyIcon,
              },
              {
                id: 'node-go-to-subgraph',
                label: 'Go To Subgraph',
                icon: SettingsCogIcon,
                conditional: (context) => {
                  const { nodeType } = context as { nodeType: string };
                  return nodeType === 'subGraph';
                },
              },
              {
                id: 'node-edit',
                label: 'Edit',
                icon: SettingsCogIcon,
              },
              {
                id: 'node-duplicate',
                label: 'Duplicate',
                icon: DuplicateIcon,
              },
              {
                id: 'nodes-factor-into-subgraph',
                label: 'Create Subgraph',
                icon: DuplicateIcon,
                conditional: () => selectedNodeIds.length > 0,
              },
              {
                id: 'node-run-to-here',
                label: 'Run to Here',
                icon: PlayIcon,
              },
              {
                id: 'node-delete',
                label: 'Delete',
                icon: DeleteIcon,
              },
            ],
          },
          blankArea: {
            contextType: type<{}>(),
            items: [
              {
                id: 'add',
                label: 'Add',
                items: addMenuConfig,
                icon: PlusIcon,
              },
              {
                id: 'paste',
                label: 'Paste',
                icon: PasteIcon,
                conditional: () => clipboard !== undefined,
              },
            ],
          },
          graphList: {
            contextType: type<{}>(),
            items: [],
          },
          graphListGraph: {
            contextType: type<{}>(),
            items: [],
          },
        },
        commands,
      }) as const satisfies ContextMenuConfig,
    [addMenuConfig, selectedNodeIds.length, commands, clipboard],
  );

  return config;
}
