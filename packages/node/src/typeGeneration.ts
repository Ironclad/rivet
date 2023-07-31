import {
  DataType,
  GraphId,
  GraphInputNode,
  GraphOutputNode,
  Nodes,
  Project,
  ScalarDataType,
  getScalarTypeOf,
  isArrayDataType,
  isFunctionDataType,
} from '@ironclad/rivet-core';
import ts from 'typescript';
import { pascalCase } from 'change-case';
import { loadProjectFromFile } from './api.js';

const dataValueTypeToDataValueName: Record<ScalarDataType, string> = {
  string: 'StringDataValue',
  number: 'NumberDataValue',
  object: 'ObjectDataValue',
  boolean: 'BoolDataValue',
  date: 'DateDataValue',
  any: 'DataValue',
  'chat-message': 'ChatMessageDataValue',
  'control-flow-excluded': 'ControlFlowExcludedDataValue',
  'gpt-function': 'GptFunctionDataValue',
  datetime: 'DateTimeDataValue',
  time: 'TimeDataValue',
  vector: 'VectorDataValue',
};

function createProjectInterface(project: Project) {
  // Create a new TypeScript source file
  const sourceFile = ts.createSourceFile('temp.ts', '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);

  // Create a printer to output the generated code
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

  // Create an array to hold the statements (interfaces) we'll add to the source file
  const statements: ts.Statement[] = [];
  const graphTypes: ts.InterfaceDeclaration[] = [];

  let projectName = pascalCase(project.metadata?.title ?? 'Untitled Project').replace(/[^a-zA-Z0-9]/g, '');
  projectName = `Project_${projectName}`;

  // Iterate over the graphs in the project
  for (const graphId in project.graphs) {
    const graph = project.graphs[graphId as GraphId]!;

    let graphName = pascalCase(graph.metadata?.name ?? 'Untitled Graph').replace(/[^a-zA-Z0-9]/g, '');
    graphName = `Graph_${graphName}`;

    // Create property signatures for the inputs and outputs
    const inputProperties: ts.PropertySignature[] = [];
    const outputProperties: ts.PropertySignature[] = [];

    // Iterate over nodes to find input and output nodes
    for (const node of (graph.nodes as Nodes[]).filter(
      (n): n is GraphInputNode | GraphOutputNode => n.type === 'graphInput' || n.type === 'graphOutput',
    )) {
      const { dataType } = node.data;

      let codeTypeName: string;
      let codeTypeGeneric: ts.TypeNode | undefined;
      if (isArrayDataType(dataType)) {
        codeTypeName = 'ArrayDataValue';
        codeTypeGeneric = ts.factory.createTypeReferenceNode(
          dataValueTypeToDataValueName[getScalarTypeOf(dataType)],
          undefined,
        );
      } else if (isFunctionDataType(dataType)) {
        codeTypeName = 'FunctionDataValue';
        codeTypeGeneric = ts.factory.createTypeReferenceNode(
          dataValueTypeToDataValueName[getScalarTypeOf(dataType)],
          undefined,
        );
      } else {
        codeTypeName = dataValueTypeToDataValueName[dataType];
      }

      if (node.type === 'graphInput') {
        inputProperties.push(
          ts.factory.createPropertySignature(
            undefined,
            node.data.id,
            undefined,
            ts.factory.createTypeReferenceNode('LoosedDataValue', [
              ts.factory.createTypeReferenceNode(codeTypeName, codeTypeGeneric ? [codeTypeGeneric] : undefined),
            ]),
          ),
        );
      } else if (node.type === 'graphOutput') {
        outputProperties.push(
          ts.factory.createPropertySignature(
            undefined,
            node.data.id,
            undefined,
            ts.factory.createTypeReferenceNode(codeTypeName, codeTypeGeneric ? [codeTypeGeneric] : undefined),
          ),
        );
      }
    }

    // Create the interfaces for the inputs and outputs
    const inputInterface = ts.factory.createInterfaceDeclaration(
      [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      `${graphName}_Inputs`,
      undefined,
      undefined,
      inputProperties,
    );
    const outputInterface = ts.factory.createInterfaceDeclaration(
      [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      `${graphName}_Outputs`,
      undefined,
      undefined,
      outputProperties,
    );

    // Add the interfaces to the statements array
    statements.push(inputInterface, outputInterface);

    // Create a type for the graph
    const graphType = ts.factory.createInterfaceDeclaration(
      [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      graphName,
      undefined,
      undefined,
      [
        ts.factory.createPropertySignature(
          undefined,
          'metadata',
          undefined,
          ts.factory.createTypeLiteralNode([
            ts.factory.createPropertySignature(
              undefined,
              'id',
              undefined,
              ts.factory.createIntersectionTypeNode([
                ts.factory.createTypeReferenceNode('GraphId', undefined),
                ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral(graphId)),
              ]),
            ),
            ts.factory.createPropertySignature(
              undefined,
              'name',
              undefined,
              ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral(graph.metadata?.name ?? '')),
            ),
            ts.factory.createPropertySignature(
              undefined,
              'description',
              undefined,
              ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral(graph.metadata?.description ?? '')),
            ),
          ]),
        ),
        ts.factory.createPropertySignature(
          undefined,
          'inputs',
          undefined,
          ts.factory.createTypeReferenceNode(`${graphName}_Inputs`, undefined),
        ),
        ts.factory.createPropertySignature(
          undefined,
          'outputs',
          undefined,
          ts.factory.createTypeReferenceNode(`${graphName}_Outputs`, undefined),
        ),
      ],
    );

    statements.push(graphType);

    graphTypes.push(graphType);
  }

  // Create a type for the project
  const projectType = ts.factory.createInterfaceDeclaration(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    projectName,
    undefined,
    undefined,
    graphTypes.map((graphType) =>
      ts.factory.createPropertySignature(
        undefined,
        graphType.name,
        undefined,
        ts.factory.createTypeReferenceNode(graphType.name, undefined),
      ),
    ),
  );

  // Add the project type to the statements array
  statements.push(projectType);

  // Update the source file with the new statements
  const updatedSourceFile = ts.factory.updateSourceFile(sourceFile, statements);

  // Print the updated source file
  const result = printer.printFile(updatedSourceFile);

  return result;
}

const path = '/Users/Shared/ironclad/ironclad/harbor/packages/leaf-app-server/src/ai-chatbot/ai-chatbot.rivet-project';
const project = await loadProjectFromFile(path);

console.log(createProjectInterface(project));
