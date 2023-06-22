---
title: 'Live Debugging'
---

## Currently Executing Nodes

During the execution of a graph, the nodes that are currently executing will be highlighted in orange. For nodes that implement it, you can zoom in and examine the partial output (such as streaming data from an LLM) by hovering over the node.

## Currently Executing Graphs

When a graph is executing, such as when using subgraphs, a spinner will be shown beside the graph in the Graphs list. You can click on the graph to view it and its current data, such as the currently executing node.

## Node Output Data

For each node, after its execution, the output of the node will be shown below the node. You can see exactly what data was output from the node.

### Execution Picker

When a node is ran multiple times, such as during loop execution, or if a subgraph has been called multiple times, a numeric picker will appear above the output of the node. 1 indicates the first time the node was executed, 2 indicates the second time, and so on.

It is not yet possible to pick between executions of a whole graph, to see only the values that were output from a specific execution of a graph. All executions of a graph are merged together.

## Pausing and Aborting

You may pause the current execution of the graph by clicking **Pause** in the top right. Any currently executing node will finish, but no new nodes will start executing. This is useful for examining the current state of the graph, without entirely aborting it.

To abort the current execution, click **Abort** in the top right.
