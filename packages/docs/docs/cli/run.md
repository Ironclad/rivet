---
id: run
sidebar_label: run
---

# Rivet CLI - `run` Command

Run a Rivet graph in a project using provided input values.

## Quick Start

```bash
# Run with basic input
npx @ironclad/rivet-cli run my-project.rivet-project --input name=Alice

# Run with JSON input
echo '{"name": "Alice"}' | npx @ironclad/rivet-cli run my-project.rivet-project --inputs-stdin

# Run specific graph
npx @ironclad/rivet-cli run my-project.rivet-project "My Graph" --input name=Alice
```

## Description

The `run` command executes a Rivet graph with specified inputs. This is particularly useful for:

- Testing graphs with specific inputs
- Integrating Rivet into command-line scripts and tools
- Automating graph execution from other programming languages
- Development and debugging of graph implementations

## Usage

The basic usage will run the main graph in the provided project file, with no input values:

```bash
npx @ironclad/rivet-cli run my-project.rivet-project
```

You can also specify a specific graph in the file to run:

```bash
npx @ironclad/rivet-cli run my-project.rivet-project "My Graph"
```

## Inputs

Inputs can be provided in two ways. The first way is to use the `--input` flag for each input value:

```bash
npx @ironclad/rivet-cli run my-project.rivet-project --input input1=5 --input input2=10
```

This is useful for basic input values and allows for easy testing of various scenarios.

The second way is to provide the inputs using a JSON object from standard input. This is useful for more complex input values:

```bash
echo '{"input1": 5, "input2": 10}' | npx @ironclad/rivet-cli run my-project.rivet-project --inputs-stdin
```

This is useful for more complex input values, such as arrays or objects, as well as piping input values from other commands or scripts.

## Outputs

The Rivet CLI outputs JSON data to standard output. Each Graph Output node in the graph will correspond to a key in the output JSON object.

The value of each property will be a [Data Value](../user-guide/data-types.md) object, with a `type` property and a `value` property.

For example, if a graph has two Graph Output Nodes, `output1` (a string) and `output2` (a number), the output JSON object will look like this:

```json
{
  "output1": {
    "type": "string",
    "value": "Hello, World!"
  }
  "output2": {
    "type": "number",
    "value": 42
  }
}
```

## Options

### Input Configuration

- `--input` - Specify an input value for the graph. Can be used multiple times.
- `--inputs-stdin` - Read input values from standard input as a JSON object. Overrides any input values provided with `--input`.
- `--context` - Specify a single [context value](../node-reference/context.mdx) for the graph. Can be used multiple times. Context can be used to pass global values to the graph. Context is specified using the same format as `--input`.

### Output Configuration

- `--include-cost` - Includes the cost of the graph execution in the output JSON object. The cost is included as a `cost` property on the output JSON.
