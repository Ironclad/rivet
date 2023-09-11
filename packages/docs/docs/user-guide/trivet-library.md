# Trivet Library

The Trivet Library is a powerful tool for running tests on your Rivet projects programmatically. It provides a way to validate and test the functionality of your Rivet graphs. All code examples in this documentation are written in TypeScript.

## How to Use the Trivet Library

### Step 1: Install the Trivet Library

You can install the Trivet Library using yarn with the following command:

```bash
yarn add -D @ironclad/trivet
```

### Step 2: Import the necessary functions and types

You'll need to import the `runTrivet` function from the Trivet Library, as well as the `loadProjectFromFile` function from the Rivet Node Library. You'll also need to import the `TrivetOpts` and `TrivetGraphRunner` types from the Trivet Library if using TypeScript.

```typescript
import { runTrivet, TrivetOpts, TrivetGraphRunner } from '@ironclad/trivet';
import { loadProjectFromFile } from '@ironclad/rivet-node';
```

### Step 3: Load your project

You can load your Rivet project from a file using the `loadProjectFromFile` function, or load your project file in any other way you wish.

```typescript
const project = await loadProjectFromFile('path/to/your/project.rivet');
```

### Step 4: Create your test suites

You'll need to create an array of `TrivetTestSuite` objects representing your test suites. Each `TrivetTestSuite` object should include an id, the ids of the test and validation graphs, and an array of `TrivetTestCase` objects representing the test cases to be run.

TODO trivet should be able to load the test suites from a rivet project file or Project.

```typescript
// TODO: Load or create your TrivetTestSuite objects
const testSuites = [...];
```

### Step 5: Create your Trivet options

You'll need to create a `TrivetOpts` object with your project, test suites, and a function to run the graph.

As Trivet hooks in to your own graph running architecture that might have external calls, it is up to you to create a `GraphProcessor` and execute it
with the correct graph and inputs.

For a basic example, you can do something like:

```typescript
const opts: TrivetOpts = {
  project,
  testSuites,
  runGraph: async (project, graphId, inputs) => {
    const processor = new GraphProcessor(project, graphId);
    return processor.processGraph(
      {
        // ProcessContext such as settings and native API
      },
      inputs,
      {},
    );
  },
};
```

### Step 6: Run your tests

Finally, you can run your tests using the `runTrivet` function. This function takes your `TrivetOpts` object and returns a Promise that resolves with the results of your tests.

```typescript
const results = await runTrivet(opts);
console.log(results);
```

## API Reference

The Trivet API is subject to change, but the current API is documented below.

### Types

- **TrivetGraphRunner**

```typescript
type TrivetGraphRunner = (project: Project, graphId: GraphId, inputs: GraphInputs) => Promise<GraphOutputs>;
```

This type represents a function which takes a project, a graphId, and inputs, and returns a Promise that resolves with GraphOutputs.

- **TrivetOpts**

```typescript
interface TrivetOpts {
  project: Project;
  testSuites: TrivetTestSuite[];
  iterationCount?: number;
  runGraph: TrivetGraphRunner;
  onUpdate?: (results: TrivetResults) => void;
}
```

This interface represents the options that can be passed to the `runTrivet` function. It includes the project to be tested, the test suites to be run, the number of iterations for each test, the function to run the graph, and an optional callback function to be called on update.

- **TrivetTestSuite**

```typescript
interface TrivetTestSuite {
  id: string;
  name?: string;
  description?: string;
  testGraph: string;
  validationGraph: string;
  testCases: TrivetTestCase[];
}
```

This interface represents a test suite, which includes an id, optional name and description, the id of the test graph, the id of the validation graph, and the test cases to be run.

- **TrivetTestCase**

```typescript
interface TrivetTestCase {
  id: string;
  input: Record<string, unknown>;
  expectedOutput: Record<string, unknown>;
}
```

This interface represents a test case, which includes an id, the input values, and the expected output values.

### Functions

- **runTrivet**

```typescript
function runTrivet(opts: TrivetOpts): Promise<TrivetResults>;
```

This function takes a `TrivetOpts` object and returns a Promise that resolves with a `TrivetResults` object. It runs each test case in each test suite the specified number of iterations, and updates the results after each iteration. The `TrivetResults` object includes the results of each test suite and the number of iterations run.

- **createTestGraphRunner**

```typescript
function createTestGraphRunner(opts: { openAiKey: string }): TrivetGraphRunner;
```

This function takes an object with an `openAiKey` and returns a `TrivetGraphRunner
