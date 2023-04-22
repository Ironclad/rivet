# AI Storyboarding Tool

This is an internal project for creating an AI storyboarding tool that allows users to create a series of prompts for a language model in a choose-your-own-adventure format. The tool is inspired by node-based editors, like the one found in Blender, and provides a user-friendly interface for crafting interactive stories with an AI language model.

## Getting Started

To get started with the project, follow these steps:

1. Clone the repository to your local machine.
2. Install the required dependencies by running `yarn` in the project directory.
3. Start the development server by running `yarn start`. This will open the app in your default web browser.

## Project Structure

The project is organized into several folders:

- `components`: Contains all the React components used in the application, such as node bodies, node editors, and other UI elements.
- `hooks`: Contains custom hooks for handling various aspects of the application, like canvas positioning, dragging nodes, and updating nodes.
- `model`: Contains the core logic for the node graph, data values, and node implementations.
- `state`: Contains the state management logic for the application, with data flow, graph state, and settings.
- `utils`: Contains utility functions and configurations, like the Monaco editor configuration.

## Editing Nodes

Each node has a corresponding NodeBody and NodeEditor component. NodeBody components define how the node appears on the canvas, while NodeEditor components define the editing interface for the node. To edit a node, click on the wrench icon within the node to open the NodeEditor component.

## Settings

To use the application, you will need to enter your OpenAI API key and the Ironclad Org ID. To do this, open the settings modal by clicking Settings on the top me (and for now, then drag any node)

## Running the Graph

To run the graph, click the green "Run" button in the top right corner of the application. This will execute the graph using the provided settings and display the results.
