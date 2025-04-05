import { type NodeGraph, type ChartNode, type NodeId } from '@ironclad/rivet-core';

// Force-directed layout parameters
const REPULSION_STRENGTH = 10000;
const ATTRACTION_STRENGTH = 0.15;
const ITERATIONS = 300;
const DAMPING = 1;
const MIN_DISTANCE = 1000;
const DEFAULT_NODE_WIDTH = 200;
const DEFAULT_NODE_HEIGHT = 200;
const CENTER_GRAVITY = 0.03;
const COOLING_FACTOR = 0.995;
const JITTER_AMOUNT = 200;
const DIRECTIONAL_BIAS = 300;
const MIN_HORIZONTAL_DISTANCE = 400;

export function useAutoLayoutGraph() {
  return (graph: NodeGraph) => {
    const { nodes, connections } = graph;

    // Build connection maps
    const outgoing = new Map<NodeId, Set<NodeId>>();
    const incoming = new Map<NodeId, Set<NodeId>>();
    const degree = new Map<NodeId, number>();

    // Initialize maps
    nodes.forEach((node) => {
      outgoing.set(node.id, new Set());
      incoming.set(node.id, new Set());
      degree.set(node.id, 0);
    });

    // Populate connection maps
    connections.forEach((conn) => {
      outgoing.get(conn.outputNodeId)?.add(conn.inputNodeId);
      incoming.get(conn.inputNodeId)?.add(conn.outputNodeId);
      degree.set(conn.outputNodeId, (degree.get(conn.outputNodeId) || 0) + 1);
      degree.set(conn.inputNodeId, (degree.get(conn.inputNodeId) || 0) + 1);
    });

    // Calculate node layers based on connections (for better initial positioning)
    const calculateNodeLayers = () => {
      // Map to track the layer of each node
      const layers = new Map<NodeId, number>();

      // Find all source nodes (no incoming connections)
      const sources = nodes.filter((node) => !incoming.get(node.id)?.size);

      // Assign sources to layer 0
      sources.forEach((node) => layers.set(node.id, 0));

      // Breadth-first traversal to assign layers
      const queue = [...sources];
      while (queue.length > 0) {
        const node = queue.shift()!;
        const currentLayer = layers.get(node.id)!;

        // Process outgoing connections
        outgoing.get(node.id)?.forEach((targetId) => {
          // If target already has a layer, take the max
          const existingLayer = layers.get(targetId);
          const newLayer = currentLayer + 1;

          if (existingLayer === undefined || newLayer > existingLayer) {
            layers.set(targetId, newLayer);
            queue.push(nodes.find((n) => n.id === targetId)!);
          }
        });
      }

      return layers;
    };

    const nodeLayers = calculateNodeLayers();

    // Initial positioning - use layer information for x-position
    let positionedNodes = nodes.map((node) => {
      const layer = nodeLayers.get(node.id) || 0;

      // Position based on layer with jitter
      const posX = layer * DIRECTIONAL_BIAS + (Math.random() * 2 - 1) * JITTER_AMOUNT * 0.3;
      const posY = (Math.random() * 2 - 1) * JITTER_AMOUNT;

      return {
        ...node,
        visualData: {
          ...node.visualData,
          x: posX,
          y: posY,
          width: node.visualData.width || DEFAULT_NODE_WIDTH,
          height: DEFAULT_NODE_HEIGHT,
        },
      };
    });

    // Distance calculation considering node dimensions
    const calculateDistance = (nodeA: ChartNode, nodeB: ChartNode) => {
      const centerAX = nodeA.visualData.x + (nodeA.visualData.width || DEFAULT_NODE_WIDTH) / 2;
      const centerAY = nodeA.visualData.y + DEFAULT_NODE_HEIGHT / 2;
      const centerBX = nodeB.visualData.x + (nodeB.visualData.width || DEFAULT_NODE_WIDTH) / 2;
      const centerBY = nodeB.visualData.y + DEFAULT_NODE_HEIGHT / 2;

      const dx = centerBX - centerAX;
      const dy = centerBY - centerAY;

      return {
        dx,
        dy,
        distance: Math.sqrt(dx * dx + dy * dy),
      };
    };

    // Run simulation synchronously for all iterations
    let temperature = 1.0;

    for (let currentIteration = 0; currentIteration < ITERATIONS; currentIteration++) {
      const forces = new Map<NodeId, { fx: number; fy: number }>();
      positionedNodes.forEach((node) => forces.set(node.id, { fx: 0, fy: 0 }));

      // Calculate center of graph for gravity
      const centerX =
        positionedNodes.reduce(
          (sum, node) => sum + node.visualData.x + (node.visualData.width || DEFAULT_NODE_WIDTH) / 2,
          0,
        ) / positionedNodes.length;
      const centerY =
        positionedNodes.reduce((sum, node) => sum + node.visualData.y + DEFAULT_NODE_HEIGHT / 2, 0) /
        positionedNodes.length;

      // 1. Apply repulsion forces between all nodes
      for (let i = 0; i < positionedNodes.length; i++) {
        const nodeA = positionedNodes[i]!;
        for (let j = i + 1; j < positionedNodes.length; j++) {
          const nodeB = positionedNodes[j]!;
          if (nodeA.id === nodeB.id) continue;

          const { dx, dy, distance } = calculateDistance(nodeA, nodeB);

          // Progressive repulsion based on distance
          let repulsionForce;
          if (distance < MIN_DISTANCE) {
            // Very strong repulsion at close distances
            repulsionForce = REPULSION_STRENGTH / Math.max(10, distance);
          } else {
            // Standard inverse square repulsion
            repulsionForce = REPULSION_STRENGTH / (distance * distance);
          }

          if (distance > 0) {
            const forceX = (dx / distance) * repulsionForce;
            const forceY = (dy / distance) * repulsionForce;

            const forceA = forces.get(nodeA.id)!;
            const forceB = forces.get(nodeB.id)!;

            forceA.fx -= forceX;
            forceA.fy -= forceY;
            forceB.fx += forceX;
            forceB.fy += forceY;
          }
        }

        // Add center gravity - prevents flying off
        // Scale by node degree - more connected nodes stay closer to center
        const nodeDegree = degree.get(nodeA.id) || 0;
        const gravityFactor = CENTER_GRAVITY * (1 + Math.min(5, nodeDegree) * 0.2);

        const forceA = forces.get(nodeA.id)!;
        const nodeACenter = {
          x: nodeA.visualData.x + (nodeA.visualData.width || DEFAULT_NODE_WIDTH) / 2,
          y: nodeA.visualData.y + DEFAULT_NODE_HEIGHT / 2,
        };

        // Apply horizontal gravity weakly, vertical gravity normally
        forceA.fx += (centerX - nodeACenter.x) * gravityFactor * 0.5; // Weaker horizontal gravity
        forceA.fy += (centerY - nodeACenter.y) * gravityFactor;
      }

      // 2. Apply edge-based attraction with directional bias
      connections.forEach((conn) => {
        const source = positionedNodes.find((n) => n.id === conn.outputNodeId);
        const target = positionedNodes.find((n) => n.id === conn.inputNodeId);
        if (!source || !target) return;

        const { dx, dy, distance } = calculateDistance(source, target);

        // Basic spring force - proportional to distance
        const springForce = ATTRACTION_STRENGTH * distance;

        if (distance > 0) {
          // Output nodes should be to the LEFT of input nodes (source left of target)
          const idealDx = DIRECTIONAL_BIAS; // Target should be DIRECTIONAL_BIAS units right of source
          const actualDx = dx; // dx = targetCenter - sourceCenter

          // Check if nodes are in wrong order (output/source is right of input/target)
          const isWrongDirection = dx < 0;

          // Apply stronger correction when in wrong direction
          const directionCorrectionFactor = isWrongDirection ? 5.0 : 0.3;

          // Calculate how much to correct
          const dxDifference = actualDx - idealDx;

          // Add directional bias to x-component with correction
          const forceX = (dx / distance) * springForce + directionCorrectionFactor * dxDifference;
          const forceY = (dy / distance) * springForce;

          const forceSource = forces.get(source.id)!;
          const forceTarget = forces.get(target.id)!;

          forceSource.fx += forceX;
          forceSource.fy += forceY;
          forceTarget.fx -= forceX;
          forceTarget.fy -= forceY;
        }
      });

      // 3. Explicit directional enforcement - apply after other forces
      // This ensures output nodes are to the left of input nodes
      connections.forEach((conn) => {
        const source = positionedNodes.find((n) => n.id === conn.outputNodeId);
        const target = positionedNodes.find((n) => n.id === conn.inputNodeId);
        if (!source || !target) return;

        const sourceRight = source.visualData.x + (source.visualData.width || DEFAULT_NODE_WIDTH);
        const targetLeft = target.visualData.x;

        // Check if output node is not sufficiently to the left of input node
        if (sourceRight + MIN_HORIZONTAL_DISTANCE > targetLeft) {
          // Calculate how much the constraint is violated
          const violation = sourceRight + MIN_HORIZONTAL_DISTANCE - targetLeft;

          // Apply strong corrective force
          const forceSource = forces.get(source.id)!;
          const forceTarget = forces.get(target.id)!;

          // Move the source left and target right
          forceSource.fx -= violation * 0.8;
          forceTarget.fx += violation * 0.8;
        }
      });

      // Apply forces with adaptive damping
      const currentDamping = DAMPING * temperature;
      positionedNodes = positionedNodes.map((node) => {
        const force = forces.get(node.id)!;

        // Limit extreme forces
        const limitForce = (f: number) => Math.sign(f) * Math.min(Math.abs(f), 50 * temperature);

        return {
          ...node,
          visualData: {
            ...node.visualData,
            x: node.visualData.x + limitForce(force.fx) * currentDamping,
            y: node.visualData.y + limitForce(force.fy) * currentDamping,
          },
        };
      });

      // Update temperature (cooling schedule)
      temperature *= COOLING_FACTOR;
    }

    // Update the UI once with final positions
    return positionedNodes;
  };
}
