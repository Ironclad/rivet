# Control Flow

The flow of data in Rivet (and the control of that flow) is handled in two passes on the graph of nodes.

## First Pass: Topological Sort & Entry Points

The first pass over nodes works on a topological sort basis. Rivet will find all nodes with no nodes that depend on them. These nodes are considered the "output nodes" of the graph.

Rivet will then find all nodes that depend on the output nodes, and so on, adding the node to a "needs to be processed" list.

Should a cycle be encountered at this point, Rivet will proceed as normal.

During the first pass, all nodes that have no dependencies (no data flowing into them) will be marked as "input nodes".

## Second Pass: Execution

Starting at the input nodes marked in the first pass, rivet will execute all pending
nodes in **parallel**.

Every time one of the nodes that is currently executing finishes, it will check to see if any of the nodes that depend on it are ready to be executed. If so, it will execute them in parallel with any other currently-executing node.

A node is defined as ready to execute if all of its dependencies have been satisfied. A dependency is satisfied if the node it depends on has finished executing and has a value to pass to the dependent node.

### Control Flow Exclusions

What happens when an If node is encountered, and the output of the If node should not run? In this case, the output of the If node is the special `control-flow-excluded` value. If this value is passed into any node, then that node will not execute.

Then, every dependent node of the node that returned `control-flow-excluded` will also return `control-flow-excluded`, and so on. In this respect, control flow exclusion "spreads" to every dependent node after the value has been returned.

Many nodes can return a `control-flow-excluded` value, such as a [Match Node](../node-reference/match.mdx) (for branches that do not match), and an [Extract Object Path Node](../node-reference/extract-object-path.mdx) (for when the input path is invalid for a given object).

### Control Flow Excluded Consumers

Certain types of nodes are registered as able to "consume" a `control-flow-excluded` value. This means that when the node encounters this value, it will actually run with the actual `control-flow-excluded` value. This allows certain nodes to "break out" of the spreading of `control-flow-excluded` values.

Nodes that can consume `control-flow-excluded` values are:

- [If/Else](../node-reference/if-else.mdx) - If the `control-flow-excluded` is passed into the `If` port, then the `Else` value will be passed through instead. If the `Else` value is not connected, then the result will again be `control-flow-excluded`.
- [Coalesce](../node-reference/coalesce.mdx) - `control-flow-excluded` will be considered "falsy" for the sake of the Coalesce node. The values will be skipped over, and subsequent truthy values connected to the Coalesce node will be passed through instead.
- [Race Inputs](../node-reference/race-inputs.mdx) - If one of the branches passed into the Race Inputs node returns `control-flow-excluded`, then that branch will simply be not considered for the race. Other branches may still execute and return a value, which will be passed through the output of the Race Inputs.
- [Graph Output](../node-reference/graph-output.mdx) - A Graph Output's `control-flow-excluded` may pass out of the graph to become one of the outputs for a [Subgraph](../node-reference/subgraph.mdx) node. This way, some of the outputs of a Subgraph may not run, and others may run.
- [Loop Controller](../node-reference/loop-controller.mdx) - A loop controller needs to consume `control-flow-excluded` values in order to run multiple times. Additionally, passing a `control-flow-excluded` to the `continue` port counts as a "successful" iteration of the loop, and will cause the loop to run again.

### Loop Controller

The loop controller is special, however, in particular its `Break` port. The `Break` port will not pass a `control-flow-excluded` value to the next node
until the loop has finished executing. Otherwise, the loop controller itself could not run multiple times before finally passing a value to the next node.

If any other input port to the loop controller receives a `control-flow-excluded` value, then the loop controller will not run again, and will pass the `control-flow-excluded` value to the node connected to `Break`. Thus, it is important to use an [If/Else](../node-reference/if-else.mdx) or [Coalesce](../node-reference/coalesce.mdx) node inside your loop as a "null check" to make sure the loop controller never receives a `control-flow-excluded` value unless you want it to.

## See Also

- [`GraphProcessor.ts`](https://github.com/Ironclad/rivet/blob/main/packages/core/src/model/GraphProcessor.ts)
