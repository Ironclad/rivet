# Loops

Loops and the loop controller are the most difficult concept in Rivet. They are also incredibly powerful and necessary for many use cases.

The following is the simplest loop you can create in Rivet:

![Simplest Loop](./assets/simplest-loop.png)

:::info

The node connected to Break is required at the moment. This gives the graph a "start point" to work backwards from. For basic cases, just connect a Graph Output node to `Break`.

:::

## Loop Controller

The loop controller is the only node in Rivet that is allowed to contain cycles of nodes including itself. The idea is the values flow _through_ the loop controller in a cycle. **All** values that can change in a loop **must** flow through the loop controller itself.

### Inputs

The loop controller has one input `Continue` that will always be present. This is a `boolean` type (but the value passed into it will be coerced into a boolean).

If the value passed into `Continue` is truthy (or `control-flow-excluded`! See [Control Flow](./control-flow.md)), then the loop will continue executing. If the value is falsy, then the loop will stop executing.

Next, the loop controller has a dynamic number of _pairs_ of values. Each pair consists of an **input** and a **default input**.

The **default input** (the 2nd in each pair!) is optional. This is the default value passed through the loop controller. In most cases, you will pass values from _outside the loop controller_ into the default inputs of the loop controller. These function as the "initial state" of your loops.

Therefore, values for the **input** ports (the 1st in each pair!) should come from _inside_ the loop (nodes that are connected to the loop controller's output ports).

### Outputs

For each pair of inputs to the loop controller (excluding the `Continue` port), the loop controller will have one additional output port.

On the first iteration, the value of this port will be the value passed into the **default value** port of the loop controller. On subsequent iterations, the value of this port will be the value passed into the **input** port of the loop controller on the previous iteration.

### Example

**Loop Controller First Iteration**: The following image shows a loop controller with two values flowing through it:

!<img width="960" alt="loop_controller_iteration_1_arrows" src="https://github.com/Ironclad/rivet/assets/135409779/13b6d377-324e-4973-b7bc-72fa90631a8b">

1. The initial values are `A` and `B`.
2. The default values of `A` and `B` flow through the loop controller to the first and 2nd outputs on the loop controller.
3. These values flow into two text nodes, one that appends `+ A`, and one that appends `+ B`.
4. These then flow back into the corresponding input ports of the loop controller.


**Loop Controller Subsequent Iterations**: On the 2nd iteration, the default values can be ignored, and the flow looks like this:

!<img width="946" alt="loop_controller_iteration_2_arrows" src="https://github.com/Ironclad/rivet/assets/135409779/e395b042-d527-40a7-a1a8-c73d9ffeff8b">


1. The `A + A` and `B + B` values flow to the output ports of the loop controller.
2. From the loop controller, the values go back to their respective text nodes to append `+ A` and `+ B` again.
3. The appended values flow back into the loop controller again.

:::info

This loop will never break. If you were to run this graph, it would error once the loop controller reached its max iteration count.

:::

**Managing Loop Iterations with the "Continue" Input Port**: You can manage loop iterations by adding a Node series that evaluates the loop state, and then provides a "falsey" output once the desired number of iterations have completed.

<img width="1194" alt="loop_controller_continue_until_six" src="https://github.com/Ironclad/rivet/assets/135409779/e66e926a-e570-477b-a2c8-cffecbb0af4f">

In this example, the output from the "B + B" loop is split based on the "+" delimeter, and the result sent to an Array Node, which is used to count the resulting array length. Since we started with an initial value of "B", the Array Length - 1 will correspond to the number of completed loops. Once the array length exceeds the value in the Number Node (here, 6), then the Compare Node will return a falsey value, which stops the loop iterations.

The following image shows the result of running this loop. At the start of the sixth loop cycle, the falsey value input at the Continue Port causes the loop to stop before sending additional values to the "A + A?" and "B + B?" Output Ports. The result of the completed loops is then sent to the Break Output Port.

<img width="752" alt="loop_controller_stopped_at_six" src="https://github.com/Ironclad/rivet/assets/135409779/14dd1750-0d13-45bb-9fcf-93a62cc4b84f">

## Recipes

### Appending to a list

A common use-case is to keep appending to some sort of array during a loop. As the [Array Node](../node-reference/array.mdx) is set to Flatten by default, this is easily accomplished by using an array node to concatenate the "current" value of the array with any additional values.

![Loop array recipe](./assets/loop-array-recipe.png)

### Chatbot

Let's say you want to make a ChatGPT style chatbot in Rivet. A graph of that would look something like this:

![Chatbot graph](./assets/chatbot-graph.png)

The loop maintains two pieces of state.

1. The entire chat history minus the last chatbot message
2. The last message from the chatbot

The flow is roughly as follows:

1. The initial message from the AI is passed into the default value of the 2nd input pair. This "seeds" the graph with the initial question to present to the user.
2. This value (the 2nd output port after `Break`) is passed into a [User Input Node](../node-reference/user-input.mdx). This prompts the user with the last message that the chatbot sent.
3. A full message history is constructed, consisting of:
   1. The previous full message history
   2. The last message from the chatbot
   3. The response from the user
4. This full message history is passed into a [Chat Node](../node-reference/chat.mdx). This node will return the next message from the chatbot.
   1. At the same time, the constructed full message history is looped back into the loop controller to form the "full message history" for the next loop.
5. The Chat Node passes its response text into a [Prompt Node](../node-reference/prompt.mdx). The prompt node is tagged with "Assistant" as the user, so that the chatbot can differentiate who sent each message.
6. This chat-message response from the AI is passed into the value of the 2nd pair of the loop controller node.
7. The loop continues

It can sometimes be difficult to understand the flow of a loop, and how to wire it up. The best way to understand it is to play around with it and see what happens!
