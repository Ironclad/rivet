import { type PortId, type NodeId } from '@ironclad/rivet-core';
import { useState, useLayoutEffect, useRef, useCallback } from 'react';
import { type PortPositions } from '../components/NodeCanvas';
import { useRecoilValue } from 'recoil';
import { nodesByIdState } from '../state/graph';

/**
 * Calculate the position of every port relative to the canvas root, in canvas space.
 * This is done in one pass per NodeCanvas render, and is used to draw the edges between nodes.
 * It's done this way with a nodePortPositions state using rounded numbers for performance reasons.
 * In the ideal case, no position will have changed, so the state does not update.
 */
export function useNodePortPositions() {
  const [nodePortPositions, setNodePortPositions] = useState<PortPositions>({});
  const nodesById = useRecoilValue(nodesByIdState);
  const canvasRef = useRef<HTMLDivElement>(null);

  const recalculate = useCallback(() => {
    // Lot of duplication but meh
    const normalPortElements = canvasRef.current?.querySelectorAll(
      '.node:not(.overlayNode) .port-circle',
    ) as NodeListOf<HTMLDivElement>;
    let changed = false;

    const newPositions = { ...nodePortPositions };
    const seen = new Set<string>();

    for (const elem of normalPortElements) {
      const portId = elem.dataset.portid! as PortId;
      const nodeId = elem.dataset.nodeid! as NodeId;
      const portType = elem.dataset.porttype! as 'input' | 'output';
      const key = `${nodeId}-${portType}-${portId}`;

      if (seen.has(key)) {
        return;
      }

      // For most nodes we can grab the harcoded position from the node data for the root position of the node
      const node = nodesById[nodeId]!;
      const nodePos = { x: node.visualData.x, y: node.visualData.y };

      // Then we add the port's offset position from the node
      const positionFromNode = { left: elem.offsetLeft, top: elem.offsetTop };
      let elemParent = elem.offsetParent as HTMLElement | undefined;

      while (!elemParent?.classList.contains('node')) {
        positionFromNode.left += elemParent?.offsetLeft ?? 0;
        positionFromNode.top += elemParent?.offsetTop ?? 0;
        elemParent = elemParent?.offsetParent as HTMLElement | undefined;
      }

      const precision = 10;

      const pos = {
        x: Math.round((nodePos.x + positionFromNode.left + elem.offsetWidth / 2) * precision) / precision,
        y: Math.round((nodePos.y + positionFromNode.top + elem.offsetHeight / 2) * precision) / precision,
      };

      if (nodePortPositions[key]?.x !== pos.x || nodePortPositions[key]?.y !== pos.y) {
        changed = true;
        newPositions[key] = pos;
      }

      seen.add(key);
    }

    const overlayPortElements = canvasRef.current?.querySelectorAll(
      '.overlayNode .port-circle',
    ) as NodeListOf<HTMLDivElement>;

    for (const elem of overlayPortElements) {
      const nodeElem = elem.closest('.node') as HTMLElement;

      const portId = elem.dataset.portid! as PortId;
      const nodeId = elem.dataset.nodeid! as NodeId;
      const portType = elem.dataset.porttype! as 'input' | 'output';
      const key = `${nodeId}-${portType}-${portId}`;

      if (seen.has(key)) {
        return;
      }

      const node = nodesById[nodeId]!;

      const nodePos = { x: node.visualData.x, y: node.visualData.y };

      // For the overlay nodes, they have an additional transform on the parent element, so we need to account for that
      const overlayPositionedElement = nodeElem.offsetParent as HTMLDivElement;
      const translate3dRegexMatch = overlayPositionedElement?.style.transform?.match(
        /translate3d\((?:([\d.-]+)(?:px?)), *(?:([\d.-]+)(?:px?)), *(?:([\d.-]+)(?:px?))?\)/,
      );
      const [, x, y] = translate3dRegexMatch ?? [];

      if (x && y) {
        nodePos.x += parseFloat(x || '0');
        nodePos.y += parseFloat(y || '0');
      }

      const positionFromNode = { left: elem.offsetLeft, top: elem.offsetTop };
      let elemParent = elem.offsetParent as HTMLElement | undefined;

      while (!elemParent?.classList.contains('node')) {
        positionFromNode.left += elemParent?.offsetLeft ?? 0;
        positionFromNode.top += elemParent?.offsetTop ?? 0;
        elemParent = elemParent?.offsetParent as HTMLElement | undefined;
      }

      const precision = 10;

      const pos = {
        x: Math.round((nodePos.x + positionFromNode.left + elem.offsetWidth / 2) * precision) / precision,
        y: Math.round((nodePos.y + positionFromNode.top + elem.offsetHeight / 2) * precision) / precision,
      };

      if (nodePortPositions[key]?.x !== pos.x || nodePortPositions[key]?.y !== pos.y) {
        changed = true;
        newPositions[key] = pos;
      }
    }

    if (changed) {
      setNodePortPositions(newPositions);
    }
  }, [nodePortPositions, nodesById]);

  useLayoutEffect(() => {
    recalculate();
  });

  return { nodePortPositions, canvasRef, recalculate };
}
