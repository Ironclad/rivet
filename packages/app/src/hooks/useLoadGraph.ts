import { useRecoilState, useRecoilValue } from 'recoil';
import { GraphId, NodeGraph, emptyNodeGraph } from '@ironclad/nodai-core';
import { graphState } from '../state/graph';
import { useSaveCurrentGraph } from './useSaveCurrentGraph';
import { canvasPositionState, lastCanvasPositionForGraphState, sidebarOpenState } from '../state/graphBuilder';
import { nanoid } from 'nanoid';
import { useStableCallback } from './useStableCallback';
import { useEffect } from 'react';
import { fitBoundsToViewport, useViewportBounds } from './useViewportBounds';

export function useLoadGraph() {
  const [graph, setGraph] = useRecoilState(graphState);

  const lastSavedCanvasPosition = useRecoilValue(
    lastCanvasPositionForGraphState(graph?.metadata?.id ?? (nanoid() as GraphId)),
  );

  const [position, setPosition] = useRecoilState(canvasPositionState);
  const saveCurrentGraph = useSaveCurrentGraph();
  const sidebarOpen = useRecoilValue(sidebarOpenState);

  // Hacky... maybe last info shouldn't be in recoil because of this
  // useEffect(() => {
  //   if (lastSavedCanvasPosition && position.x === 0 && position.y === 0 && position.zoom === 1 && !position.fromSaved) {
  //     setPosition({ ...lastSavedCanvasPosition, fromSaved: true });
  //   }
  // }, [graph, lastSavedCanvasPosition, position, setPosition]);

  return useStableCallback((savedGraph: NodeGraph) => {
    if (graph.nodes.length > 0 || graph.metadata?.name !== emptyNodeGraph().metadata!.name) {
      saveCurrentGraph();
    }

    setPosition(lastSavedCanvasPosition ?? { x: 0, y: 0, zoom: 1 });

    setGraph(savedGraph);

    const minNodeX = Math.min(...savedGraph.nodes.map((n) => n.visualData.x));
    const maxNodeX = Math.max(...savedGraph.nodes.map((n) => n.visualData.x + (n.visualData.width ?? 300)));
    const minNodeY = Math.min(...savedGraph.nodes.map((n) => n.visualData.y));
    const maxNodeY = Math.max(...savedGraph.nodes.map((n) => n.visualData.y + 300));

    const bounds = {
      x: minNodeX - 100,
      y: minNodeY - 100,
      width: maxNodeX - minNodeX + 200,
      height: maxNodeY - minNodeY + 200,
    };

    const fittedCanvasPosition = fitBoundsToViewport(bounds, { sidebarOpen });
    setPosition(fittedCanvasPosition);

    console.dir({ bounds, fittedCanvasPosition });
  });
}
