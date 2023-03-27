import { useState } from 'react';
import { NodeCanvas } from './components/NodeCanvas';
import { Nodes } from './model/Nodes';
import { ChartNode, NodeConnection } from './model/NodeBase';
import { ConcatNodeImpl } from './model/nodes/ConcatNode';

function App() {
  const [nodes, setNodes] = useState<ChartNode<string, unknown>[]>([] satisfies Nodes[]);
  const [connections, setConnections] = useState<NodeConnection[]>([]);

  return (
    <div>
      <NodeCanvas
        nodes={nodes}
        connections={connections}
        onNodesChanged={setNodes}
        onConnectionsChanged={setConnections}
      />
    </div>
  );
}

export default App;
