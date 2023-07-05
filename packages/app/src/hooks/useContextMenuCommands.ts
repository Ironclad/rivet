import { useMemo } from 'react';
import { projectGraphInfoState } from '../state/savedGraphs';
import { useRecoilValue } from 'recoil';
import { values } from '../utils/typeSafety';
import { ContextMenuItem } from './useContextMenuConfiguration';

export function useContextMenuCommands() {
  const projectInfo = useRecoilValue(projectGraphInfoState);

  const commands = useMemo(() => {
    const goToGraphCommands = values(projectInfo.graphs).map(
      (graph): ContextMenuItem => ({
        id: `go-to-graph-${graph.id}`,
        label: `${graph.name}`,
        subLabel: `Go to graph ${graph.name}`,
        data: graph.id,
      }),
    );

    return [...goToGraphCommands];
  }, [projectInfo]);

  return commands;
}
