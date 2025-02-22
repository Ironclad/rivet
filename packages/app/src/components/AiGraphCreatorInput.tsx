import { css } from '@emotion/react';
import { useState, type FC, type KeyboardEvent } from 'react';
import TextArea from '@atlaskit/textarea';
import { useAtom, useAtomValue } from 'jotai';
import { graphState } from '../state/graph';
import { swallowPromise } from '../utils/syncWrapper';
import {
  coerceType,
  coreCreateProcessor,
  deserializeDatasets,
  deserializeProject,
  ExecutionRecorder,
  getError,
  globalRivetNodeRegistry,
  InMemoryDatasetProvider,
  NodeConnection,
  type NodeId,
  serializeGraph,
} from '@ironclad/rivet-core';
import graphBuilderProject from '../../graphs/graph-creator.rivet-project?raw';
import graphBuilderData from '../../graphs/graph-creator.rivet-data?raw';
import { fillMissingSettingsFromEnvironmentVariables } from '../utils/tauri';
import { settingsState } from '../state/settings';
import { useDependsOnPlugins } from '../hooks/useDependsOnPlugins';
import { cloneDeep } from 'lodash-es';
import { TauriNativeApi } from '../model/native/TauriNativeApi';
import { useCenterViewOnGraph } from '../hooks/useCenterViewOnGraph';
import { useAutoLayoutGraph } from '../hooks/useAutoLayoutGraph';
import { BaseDirectory, writeFile, createDir } from '@tauri-apps/api/fs';
import { appLogDir } from '@tauri-apps/api/path';
import { toast } from 'react-toastify';
const styles = css`
  position: fixed;
  top: calc(var(--project-selector-height) + 40px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--grey-darker);
  border-radius: 4px;
  border: 1px solid var(--grey-dark);
  z-index: 50;
  gap: 8px;
  box-shadow: 3px 1px 10px rgba(0, 0, 0, 0.5);
  user-select: none;
  width: 500px;

  .feedback {
    font-size: 12px;
    color: var(--grey-light);
    padding: 8px;
  }
`;

export const AiGraphCreatorInput: FC = () => {
  const [prompt, setPrompt] = useState<string>('');

  const [graph, setGraph] = useAtom(graphState);

  const settings = useAtomValue(settingsState);
  const plugins = useDependsOnPlugins();

  const centerView = useCenterViewOnGraph();
  const autoLayout = useAutoLayoutGraph();

  const [feedbackItems, setFeedbackItems] = useState<string[]>([]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      swallowPromise(applyPrompt(prompt));
      setPrompt('');
    }
  };

  async function applyPrompt(prompt: string) {
    try {
      let workingGraph = cloneDeep(graph);

      const serializedGraph = serializeGraph(workingGraph);

      const [project] = deserializeProject(graphBuilderProject);
      const data = deserializeDatasets(graphBuilderData);

      toast.info('Working...');

      const recorder = new ExecutionRecorder();

      const showChanges = () => {
        workingGraph = {
          ...workingGraph,
          nodes: autoLayout(workingGraph),
        };
        setGraph(workingGraph);
        centerView(workingGraph);
      };

      const processor = coreCreateProcessor(project, {
        graph: 'Main',
        inputs: {
          request: prompt,
          graph: serializedGraph as string,
        },
        context: {
          allNodeTypes: {
            type: 'string[]',
            value: globalRivetNodeRegistry.getNodeTypes(),
          },
        },
        externalFunctions: {
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

            const sourcePort = sourceInstance
              .getOutputDefinitions([], {}, project)
              .find((port) => port.id === sourcePortId);
            const destPort = destInstance.getInputDefinitions([], {}, project).find((port) => port.id === destPortId);

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

            workingGraph.connections = workingGraph.connections.filter(
              (connection) =>
                !(
                  connection.outputNodeId === sourceNodeId &&
                  connection.inputNodeId === destNodeId &&
                  connection.outputId === sourcePortId &&
                  connection.inputId === destPortId
                ),
            );

            showChanges();

            return {
              type: 'boolean',
              value: true,
            };
          },
          getSerializedGraph: async () => {
            return {
              type: 'string',
              value: serializeGraph(workingGraph) as string,
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

            const inputs = instance.getInputDefinitions(connectionsToNode, nodesById, project);
            const outputs = instance.getOutputDefinitions(connectionsToNode, nodesById, project);

            return {
              type: 'object',
              value: {
                inputs,
                outputs,
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
              value: node.data as Record<string, unknown>,
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

              try {
                const sourcePort = sourceInstance
                  .getOutputDefinitions([], {}, project)
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
                  .getInputDefinitions([], {}, project)
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

            return {
              type: 'string[]',
              value: warnings,
            };
          },
        },
        onUserEvent: {
          runningCommands: (data) => {
            const functionName = coerceType(data, 'object').name;
            setFeedbackItems((items) => [...items, `Running ${functionName}...`].slice(-6));
          },
          finalMessage: (data) => {
            const message = coerceType(data, 'string');
            toast.info(message);
          },
        },
        nativeApi: new TauriNativeApi(),
        datasetProvider: new InMemoryDatasetProvider(data),
        ...(await fillMissingSettingsFromEnvironmentVariables(settings, plugins)),
      });

      recorder.record(processor.processor);

      await processor.run();

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

      setFeedbackItems([]);
    } catch (err) {
      const error = getError(err);

      toast.error(`Error: ${error.message}`);
      setFeedbackItems([]);
    }
  }

  return (
    <div css={styles}>
      <div className="input-area">
        <TextArea
          isCompact
          isRequired
          isDisabled={false}
          isInvalid={false}
          isReadOnly={false}
          placeholder="Enter your prompt here"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
      <div className="feedback">
        {feedbackItems.map((item, index) => (
          <div key={index}>{item}</div>
        ))}
      </div>
    </div>
  );
};
