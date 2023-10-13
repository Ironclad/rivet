# Chat-loop Example - RPG

## What

This is an example standalone Rivet project that implements a text-based RPG powered by ChatGPT.

With it, we demonstrate `Assemble Prompt`, `Loop Controller`, `Subgraph`, `Chat`, `RNG`, and `Array`.

## How

1. Loop Iteration subgraph:
   1. Input: the chat history so far
   2. Generate the ChatGPT response
   3. Show the user that ChatGPT response and ask for input
   4. Combine the original history, the ChatGPT response, and the user's response into a new history
   5. Output: the new history
2. Initialize chat subgraph:
   1. Chooses a random setting from an array
   2. Use ChatGPT to generate the initial setting for the adventure
   3. Show the user the initial setting and ask for input
   4. Combine the initial setting and the user input to create a chat history
   5. Output: that history
3. Main
   1. Use a loop controller, initialized with the `Initialize Chat` output, to repeatedly call the `Loop Iteration` subgraph
