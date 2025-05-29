import {
  serializeGraph,
  deserializeProject,
  deserializeDatasets,
  ExecutionRecorder,
  coreCreateProcessor,
  globalRivetNodeRegistry,
  type NodeId,
  coerceType,
  InMemoryDatasetProvider,
  getError,
  type ExternalFunction,
  type DataValue,
  registerBuiltInNodes,
  NodeRegistration,
  plugins as corePlugins,
} from '@ironclad/rivet-core';
import { createDir, BaseDirectory, writeFile } from '@tauri-apps/api/fs';
import { appLogDir } from '@tauri-apps/api/path';
import { cloneDeep } from 'lodash-es';
import { toast } from 'react-toastify';
import { TauriNativeApi } from '../model/native/TauriNativeApi';
import { fillMissingSettingsFromEnvironmentVariables } from '../utils/tauri';
import { useAtom, useAtomValue } from 'jotai';
import { graphState } from '../state/graph';
import { settingsState } from '../state/settings';
import { useAutoLayoutGraph } from './useAutoLayoutGraph';
import { useCenterViewOnGraph } from './useCenterViewOnGraph';
import { useDependsOnPlugins } from './useDependsOnPlugins';
import graphBuilderProject from '../../graphs/graph-creator.rivet-project?raw';
import graphBuilderData from '../../graphs/graph-creator.rivet-data?raw';
import { referencedProjectsState } from '../state/savedGraphs';

export function useAiGraphBuilder({ record, onFeedback }: { record: boolean; onFeedback: (feedback: string) => void }) {
  const [graph, setGraph] = useAtom(graphState);

  const settings = useAtomValue(settingsState);
  const plugins = useDependsOnPlugins();

  const centerView = useCenterViewOnGraph();
  const autoLayout = useAutoLayoutGraph();

  const referencedProjects = useAtomValue(referencedProjectsState);

  return async function applyPrompt(prompt: string, modelAndApi: `${string}:${string}`, abort: AbortSignal) {
    const recorder = new ExecutionRecorder({ includePartialOutputs: false, includeTrace: false });

    try {
      let workingGraph = cloneDeep(graph);

      const [project] = deserializeProject(graphBuilderProject);
      const data = deserializeDatasets(graphBuilderData);

      toast.info('Working...');

      const showChanges = () => {
        workingGraph = {
          ...workingGraph,
          nodes: autoLayout(workingGraph),
        };
        setGraph(workingGraph);
        centerView(workingGraph);
      };

      const externalFunctions: Record<string, ExternalFunction> = {
        createNode: async (_ctx, nodeType) => {
          const newNode = globalRivetNodeRegistry.createDynamic(nodeType as string);
          workingGraph.nodes.push(newNode);
          showChanges();
          return {
            type: 'string',
            value: newNode.id,
          };
        },
        connectNodes: async (_ctx, options) => {
          const { sourceNodeId, destNodeId, sourcePortId, destPortId } = options as any;

          const sourceNode = workingGraph.nodes.find((node) => node.id === sourceNodeId);
          const destNode = workingGraph.nodes.find((node) => node.id === destNodeId);

          if (!sourceNode) {
            throw new Error(`Node with ID ${sourceNodeId} not found`);
          }

          if (!destNode) {
            throw new Error(`Node with ID ${destNodeId} not found`);
          }

          const sourceInstance = globalRivetNodeRegistry.createDynamicImpl(sourceNode);
          const destInstance = globalRivetNodeRegistry.createDynamicImpl(destNode);

          const sourceNodeConnections = workingGraph.connections.filter(
            (connection) => connection.outputNodeId === sourceNodeId,
          );
          const destNodeConnections = workingGraph.connections.filter(
            (connection) => connection.inputNodeId === destNodeId,
          );

          const nodesById = Object.fromEntries(workingGraph.nodes.map((node) => [node.id, node]));

          const sourcePort = sourceInstance
            .getOutputDefinitions(sourceNodeConnections, nodesById, project, referencedProjects)
            .find((port) => port.id === sourcePortId);

          const destPort = destInstance
            .getInputDefinitions(destNodeConnections, nodesById, project, referencedProjects)
            .find((port) => port.id === destPortId);

          if (!sourcePort) {
            throw new Error(`Output port with ID ${sourcePortId} not found on node ${sourceNodeId}`);
          }

          if (!destPort) {
            throw new Error(`Input port with ID ${destPortId} not found on node ${destNodeId}`);
          }

          const alreadyConnectedToDest = workingGraph.connections.find(
            (connection) => connection.inputNodeId === destNodeId && connection.inputId === destPortId,
          );

          if (alreadyConnectedToDest) {
            throw new Error(`Node ${destNodeId} is already connected to this output. Disconnect it first.`);
          }

          workingGraph.connections.push({
            outputNodeId: sourceNodeId,
            outputId: sourcePortId,
            inputNodeId: destNodeId,
            inputId: destPortId,
          });

          showChanges();

          return {
            type: 'boolean',
            value: true,
          };
        },
        disconnectNodes: async (_ctx, options) => {
          const { sourceNodeId, destNodeId, sourcePortId, destPortId } = options as any;

          const toRemove = workingGraph.connections.find(
            (connection) =>
              connection.outputNodeId === sourceNodeId &&
              connection.inputNodeId === destNodeId &&
              connection.outputId === sourcePortId &&
              connection.inputId === destPortId,
          );

          if (!toRemove) {
            throw new Error(`Connection not found. Use reviewGraph to see all connections.`);
          }

          workingGraph.connections = workingGraph.connections.filter((connection) => connection !== toRemove);

          showChanges();

          return {
            type: 'boolean',
            value: true,
          };
        },
        getSerializedGraph: async () => {
          return {
            type: 'string',
            value: JSON.stringify(workingGraph, null, 2),
          };
        },
        getPorts: async (_ctx, nodeId) => {
          const node = workingGraph.nodes.find((node) => node.id === nodeId);

          if (!node) {
            throw new Error(`Node with ID ${nodeId} not found`);
          }

          const connectionsToNode = workingGraph.connections.filter(
            (connection) => connection.inputNodeId === node.id || connection.outputNodeId === node.id,
          );

          const instance = globalRivetNodeRegistry.createDynamicImpl(node);

          const nodesById = Object.fromEntries(workingGraph.nodes.map((node) => [node.id, node]));

          const inputs = instance.getInputDefinitions(connectionsToNode, nodesById, project, referencedProjects);
          const outputs = instance.getOutputDefinitions(connectionsToNode, nodesById, project, referencedProjects);

          const inputsWithConnections = inputs.map((input) => ({
            definition: input,
            connectedTo: connectionsToNode.find((connection) => connection.inputId === input.id),
            actualDataType: node.isSplitRun ? `${input.dataType}[]` : input.dataType,
          }));

          const outputsWithConnections = outputs.map((output) => ({
            definition: output,
            connectedTo: connectionsToNode.filter((connection) => connection.outputId === output.id),
            actualDataType: node.isSplitRun ? `${output.dataType}[]` : output.dataType,
          }));

          return {
            type: 'object',
            value: {
              inputs: inputsWithConnections,
              outputs: outputsWithConnections,
            },
          };
        },
        showChanges: async () => {
          return {
            type: 'boolean',
            value: true,
          };
        },
        editNode: async (_ctx, nodeId, key, value) => {
          const node = workingGraph.nodes.find((node) => node.id === nodeId);

          if (!node) {
            throw new Error(`Node with ID ${nodeId} not found`);
          }

          if (!((key as string) in (node.data as object))) {
            throw new Error(
              `Key ${key} does not exist on node data. If you are sure you want to set a new key, use addNodeData instead.`,
            );
          }

          (node.data as Record<string, unknown>)[key as string] = value;

          showChanges();

          return {
            type: 'object',
            value: node.data as Record<string, unknown>,
          };
        },
        getNodeData: async (_ctx, nodeId) => {
          const node = workingGraph.nodes.find((node) => node.id === nodeId);

          if (!node) {
            throw new Error(`Node with ID ${nodeId} not found`);
          }

          return {
            type: 'object',
            value: {
              data: node.data as Record<string, unknown>,
              splittingEnabled: node.isSplitRun,
            },
          };
        },
        deleteNode: async (_ctx, nodeId) => {
          const node = workingGraph.nodes.find((node) => node.id === nodeId);

          if (!node) {
            throw new Error(`Node with ID ${nodeId} not found`);
          }

          workingGraph.nodes = workingGraph.nodes.filter((node) => node.id !== nodeId);
          workingGraph.connections = workingGraph.connections.filter(
            (connection) => connection.inputNodeId !== nodeId && connection.outputNodeId !== nodeId,
          );

          showChanges();

          return {
            type: 'boolean',
            value: true,
          };
        },
        addNodeData: async (_ctx, nodeId, key, value) => {
          const node = workingGraph.nodes.find((node) => node.id === nodeId);

          if (!node) {
            throw new Error(`Node with ID ${nodeId} not found`);
          }

          (node.data as Record<string, unknown>)[key as string] = value;

          showChanges();

          return {
            type: 'object',
            value: node.data as Record<string, unknown>,
          };
        },
        lintGraph: async () => {
          const warnings: string[] = [];

          for (const connection of workingGraph.connections) {
            const sourceNode = workingGraph.nodes.find((node) => node.id === connection.outputNodeId);
            const destNode = workingGraph.nodes.find((node) => node.id === connection.inputNodeId);

            if (!sourceNode || !destNode) {
              warnings.push(`Node not found for connection: ${JSON.stringify(connection)}`);
              continue;
            }

            const sourceInstance = globalRivetNodeRegistry.createDynamicImpl(sourceNode);
            const destInstance = globalRivetNodeRegistry.createDynamicImpl(destNode);

            const sourceConnections = workingGraph.connections.filter((conn) => conn.outputNodeId === sourceNode.id);

            const destConnections = workingGraph.connections.filter((conn) => conn.inputNodeId === destNode.id);

            const nodesById = Object.fromEntries(workingGraph.nodes.map((node) => [node.id, node]));

            try {
              const sourcePort = sourceInstance
                .getOutputDefinitions(sourceConnections, nodesById, project, referencedProjects)
                .find((port) => port.id === connection.outputId);

              if (!sourcePort) {
                warnings.push(`Port not found for connection: ${JSON.stringify(connection)}`);
                continue;
              }
            } catch (e) {
              warnings.push(`Error getting source port for connection: ${JSON.stringify(connection)}`);
              continue;
            }

            try {
              const destPort = destInstance
                .getInputDefinitions(destConnections, nodesById, project, referencedProjects)
                .find((port) => port.id === connection.inputId);

              if (!destPort) {
                warnings.push(`Port not found for connection: ${JSON.stringify(connection)}`);
                continue;
              }
            } catch (e) {
              warnings.push(`Error getting dest port for connection: ${JSON.stringify(connection)}`);
              continue;
            }
          }

          // Find islands of nodes, i.e. the graph does not form a cohesive unit
          const visited = new Set<NodeId>();
          const islands: NodeId[][] = [];
          const dfs = (nodeId: NodeId, island: NodeId[]) => {
            visited.add(nodeId);
            island.push(nodeId);

            for (const connection of workingGraph.connections) {
              if (connection.outputNodeId === nodeId && !visited.has(connection.inputNodeId)) {
                dfs(connection.inputNodeId, island);
              } else if (connection.inputNodeId === nodeId && !visited.has(connection.outputNodeId)) {
                dfs(connection.outputNodeId, island);
              }
            }
          };
          for (const node of workingGraph.nodes) {
            if (!visited.has(node.id)) {
              const island: NodeId[] = [];
              dfs(node.id, island);
              islands.push(island);
            }
          }
          if (islands.length > 1) {
            warnings.push(`Graph is not connected as one unit. Found ${islands.length} islands.`);
          }

          // Find mismatched data types
          for (const connection of workingGraph.connections) {
            const sourceNode = workingGraph.nodes.find((node) => node.id === connection.outputNodeId);
            const destNode = workingGraph.nodes.find((node) => node.id === connection.inputNodeId);

            if (!sourceNode || !destNode) {
              continue;
            }

            const sourceInstance = globalRivetNodeRegistry.createDynamicImpl(sourceNode);
            const destInstance = globalRivetNodeRegistry.createDynamicImpl(destNode);

            const sourceConnections = workingGraph.connections.filter((conn) => conn.outputNodeId === sourceNode.id);

            const destConnections = workingGraph.connections.filter((conn) => conn.inputNodeId === destNode.id);

            const nodesById = Object.fromEntries(workingGraph.nodes.map((node) => [node.id, node]));

            try {
              const sourcePort = sourceInstance
                .getOutputDefinitions(sourceConnections, nodesById, project, referencedProjects)
                .find((port) => port.id === connection.outputId);

              if (!sourcePort) {
                continue;
              }

              const destPort = destInstance
                .getInputDefinitions(destConnections, nodesById, project, referencedProjects)
                .find((port) => port.id === connection.inputId);

              if (!destPort) {
                continue;
              }

              const sourceType = sourceNode.isSplitRun ? `${sourcePort.dataType}[]` : sourcePort.dataType;
              const destType = destNode.isSplitRun ? `${destPort.dataType}[]` : destPort.dataType;

              const coerced = destPort.coerced ?? true;

              const isAny =
                sourceType === 'any' || destType === 'any' || sourceType === 'any[]' || destType === 'any[]';

              if (sourceType !== destType && !coerced && !isAny) {
                warnings.push(
                  `Data type mismatch: ${sourceType} -> ${destType} for connection: ${JSON.stringify(connection)}`,
                );
              } else if (sourceType !== destType && coerced && !isAny) {
                warnings.push(
                  `Minor: Coerced data type mismatch: ${sourceType} -> ${destType} for connection: ${JSON.stringify(connection)}. Data will be coerced to ${destType} successfully, but this may not be what you want.`,
                );
              }
            } catch (e) {
              continue;
            }
          }

          // Find nodes with no connections
          for (const node of workingGraph.nodes) {
            const connections = workingGraph.connections.filter(
              (connection) => connection.inputNodeId === node.id || connection.outputNodeId === node.id,
            );

            if (connections.length === 0) {
              warnings.push(`Node ${node.id} has no connections.`);
            }
          }

          return {
            type: 'string[]',
            value: warnings,
          };
        },
        toggleSplitting: async (_ctx, nodeId, enabled, maxSplitAmount) => {
          const node = workingGraph.nodes.find((node) => node.id === nodeId);

          if (!node) {
            throw new Error(`Node with ID ${nodeId} not found`);
          }

          if ((maxSplitAmount as number) <= 0) {
            throw new Error(`Max split amount must be greater than 0. Recommended is 100.`);
          }

          node.isSplitRun = enabled as boolean;
          node.splitRunMax = maxSplitAmount as number;

          showChanges();
          return {
            type: 'boolean',
            value: true,
          };
        },
      };

      const onUserEvent: { [key: string]: (data: DataValue | undefined) => void } = {
        runningCommands: (data) => {
          const functionName = coerceType(data, 'object').name;

          if (functionName !== 'updateUser') {
            onFeedback(`Running ${functionName}...`);
          }
        },
        finalMessage: (data) => {
          const message = coerceType(data, 'string');
          toast.info(message);
        },
        updateUser: (data) => {
          const message = coerceType(data, 'string');
          onFeedback(message);
        },
      };

      const [api, model] = modelAndApi.split(':');

      const registry = registerBuiltInNodes(new NodeRegistration());
      registry.registerPlugin(corePlugins.anthropic);

      const processor = coreCreateProcessor(project, {
        graph: 'Main',
        inputs: {
          request: prompt,
          graph: JSON.stringify(workingGraph, null, 2),
          model: model!,
          api: api!,
        },
        abortSignal: abort,
        context: {
          allNodeTypes: {
            type: 'string[]',
            value: globalRivetNodeRegistry.getNodeTypes(),
          },
        },
        externalFunctions,
        onUserEvent,
        nativeApi: new TauriNativeApi(),
        datasetProvider: new InMemoryDatasetProvider(data),
        registry,
        ...(await fillMissingSettingsFromEnvironmentVariables(settings, plugins)),
      });

      if (record) {
        recorder.record(processor.processor);
      }

      const { cost } = await processor.run();

      if (record) {
        const serialized = recorder.serialize();

        const fileName = `recordings/graph-${Date.now()}.rivet-recording`;

        await createDir('recordings', {
          dir: BaseDirectory.AppLog,
          recursive: true,
        });

        await writeFile(fileName, serialized, {
          dir: BaseDirectory.AppLog,
        });

        console.log(`Recording saved to ${await appLogDir()}${fileName}`);
      }

      console.log(`Cost: ${coerceType(cost, 'number')}`);
    } catch (err) {
      if (record) {
        const serialized = recorder.serialize();
        const fileName = `recordings/error-${Date.now()}.rivet-recording`;
        await createDir('recordings', {
          dir: BaseDirectory.AppLog,
          recursive: true,
        });
        await writeFile(fileName, serialized, {
          dir: BaseDirectory.AppLog,
        });
        console.log(`Recording saved to ${await appLogDir()}${fileName}`);
      }

      const error = getError(err);

      console.error(`Error details:`, error);

      toast.error(`Error: ${error.message}`);
    }
  };
}
