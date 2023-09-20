# Chat Viewer

The Chat Viewer gives you a live view of all Chat nodes that are running in your Rivet graphs. It is accessible by clicking the "Chat Viewer" tab at the top of Rivet.

![Chat Viewer](./assets/chat-viewer.png)

Each Chat that executes will show as a bubble in the Chat Viewer, with live text streamed in.

At the top of each bubble, you will see what graph contains the executing Chat node, and you can qucikly navigate to that graph without interrupting execution.

The top half of each bubble contains the input to the Chat node, and the bottom half contains the output.

If a Chat node is [split](../splitting.md), then it will appear as multiple bubbles in the Chat Viewer!

## Filter

At the top, you may enter text to filter what graphs you are seeing Chat bubbles for. This is useful for narrowing down the chats to a specific part of your agent that you are currently working on, and ignoring other noise.
