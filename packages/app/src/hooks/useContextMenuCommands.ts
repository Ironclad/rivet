import { useMemo } from 'react';
import { projectGraphInfoState } from '../state/savedGraphs.js';
import { useAtomValue } from 'jotai';
import { type ContextMenuItem } from './useContextMenuConfiguration.js';
import { values } from '../../../core/src/utils/typeSafety';

export function useContextMenuCommands() {
  const projectInfo = useAtomValue(projectGraphInfoState);

  const commands = useMemo(() => {
    const goToGraphCommands = values(projectInfo.graphs).map(
      (graph): ContextMenuItem => ({
        id: `go-to-graph:${graph.id}`,
        label: `${graph.name}`,
        subLabel: `Go to graph ${graph.name}`,
        data: graph.id,
      }),
    );

    return [...goToGraphCommands];
  }, [projectInfo]);

  return commands;
}
