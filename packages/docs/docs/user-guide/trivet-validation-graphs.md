---
sidebar_label: Validation Graphs
---

# Trivet - Validator Graphs

Instead of using baked-in validations, Trivet uses Rivet graphs to perform validation on your test graph. This allows you the ultimate flexibility in how you want to validate your graph. It is common to make LLM calls to validate your graph - a great pattern is asking an LLM to respond with `YES` or `NO` after asking it a question, and then using a [Match](../node-reference/match) node to find either the YES or NO.

Select the validator graph using the dropdown at the top:

![Validator Graph Dropdown](assets/trivet-validator-graph-dropdown.png)

A validator graph is a specially constructed Rivet graph, with the following requirements:

- It must have an Graph Input node named `input` of type Object.
- It must have a Graph Input node named `output` of type Object.
- It must have a Graph Input node named `expectedOutput` of type Object.
- It must have any number of Graph Output nodes that must be either String, or Boolean. These are the "validations" that the graph performs.

You may choose any of these input nodes, or you may ignore any of them to perform your validation.

## `input` Input

This an object representing the inputs which were passed into the Test graph. It is an Object type where each property corresponds to one of the inputs to the Test graph.

## `output` Output

This an object representing the outputs which were returned from the Test graph. It is an Object type where each property corresponds to one of the outputs from the Test graph.

## `expectedOutput` Output

This is an object representing the expected outputs from the Test graph. It is an Object type that is passed in to the validation graph from the test case. The properties will exactly match the properties on the `output` object, however the actual values can be anything you wish.

A common pattern is, if the validation graph is performing an LLM call to check the result, for each expected output to be a plain statement validation you are asking about the corresponding `output`. For example, if you have the output:

```json
{
  "name": "John Doe",
  "age": 42
}
```

Then you might have the expected output:

```json
{
  "name": "The name must be John Doe.",
  "age": "The age must be 42."
}
```

## Outputs

The outputs of the validator graph are the validations that are performed. Each output must be either a String or a Boolean. If it is a String, then it must be truthy such as `"true"` or `"false"`. If it is a Boolean, then it is a boolean validation.

In the future, we may allow outputs to specify what went wrong with a validation.
