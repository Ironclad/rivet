---
title: Prompt Designer
---

The Prompt Designer is a feature in Rivet that allows you to interactively design and test prompts for an AI language model. It provides a user-friendly interface for crafting interactive stories.
Overview

The Prompt Designer consists of two main sections: Config and Test.

## Config

In the Config section, you can set various parameters for the AI model. These include the model to use, the randomness of the AI's responses (temperature), the maximum length of the AI's responses (max tokens), and penalties for using frequent or new tokens.

## Test

The Test section allows you to set up and run test groups. Each test group can contain multiple test cases. You can add a new test group by clicking the "Add Test Group" button.

### Messages

The Prompt Designer also allows you to add, edit, and delete messages. Messages are displayed in the order they were added. You can add a new message by clicking the "+ Add message" button.

### Running the Prompt Designer

To run the Prompt Designer, click the "Run" button. This will execute the current configuration and display the AI's response.

### Closing the Prompt Designer

To close the Prompt Designer, click the "x" button in the top right corner of the panel.

### State Management

The Prompt Designer uses Recoil for state management. The state includes the messages, the configuration data, the response, and the test group results.

### Code Highlighting

The Prompt Designer uses Monaco Editor for code highlighting. It supports prompt interpolation and markdown.

### Node Implementation

The Prompt Designer is implemented as a node in Rivet. The node has various properties such as type, name, and prompt text.

