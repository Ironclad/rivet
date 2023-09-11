import { FC, useMemo, useState, MouseEvent } from 'react';
import { editingNodeState } from '../state/graphBuilder.js';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { connectionsForSingleNodeState, connectionsState, nodesByIdState, nodesState } from '../state/graph.js';
import styled from '@emotion/styled';
import { ReactComponent as MultiplyIcon } from 'majesticons/line/multiply-line.svg';
import { ChartNode, NodeTestGroup, GraphId, globalRivetNodeRegistry } from '@ironclad/rivet-core';
import { useUnknownNodeComponentDescriptorFor } from '../hooks/useNodeTypes.js';
import { produce } from 'immer';
import { useHotkeys } from 'react-hotkeys-hook';
import { InlineEditableTextfield } from '@atlaskit/inline-edit';
import Toggle from '@atlaskit/toggle';
import { useStableCallback } from '../hooks/useStableCallback.js';
import { DefaultNodeEditor } from './DefaultNodeEditor.js';
import Tabs, { Tab, TabList, TabPanel } from '@atlaskit/tabs';
import { Field } from '@atlaskit/form';
import TextField from '@atlaskit/textfield';
import Select from '@atlaskit/select';
import Button from '@atlaskit/button';
import Popup from '@atlaskit/popup';
import { orderBy } from 'lodash-es';
import { nanoid } from 'nanoid';
import { ErrorBoundary } from 'react-error-boundary';
import { projectState } from '../state/savedGraphs';

export const NodeEditorRenderer: FC = () => {
  const nodesById = useRecoilValue(nodesByIdState);
  const [editingNodeId, setEditingNodeId] = useRecoilState(editingNodeState);

  const deselect = useStableCallback(() => {
    setEditingNodeId(null);
  });

  const selectedNode = editingNodeId ? nodesById[editingNodeId] : undefined;

  if (!editingNodeId || !selectedNode) {
    return null;
  }

  return (
    <ErrorBoundary fallback={null}>
      <NodeEditor selectedNode={selectedNode} onDeselect={deselect} />
    </ErrorBoundary>
  );
};

const Container = styled.div`
  position: absolute;
  top: 32px;
  // tabpanel the parent has a padding of 8px on the left and right, so just move it over a bit...
  right: -8px;
  bottom: 0;
  width: 45%;
  max-width: 1000px;
  min-width: 500px;

  .panel-container {
    display: flex;
    flex-direction: column;
    color: var(--foreground);
    background-color: var(--grey-dark-bluish-seethrough);
    backdrop-filter: blur(2px);
    font-family: 'Roboto Mono', monospace;
    width: 100%;
    box-shadow: -4px 0 3px rgba(0, 0, 0, 0.1);
    border-left: 1px solid var(--grey);
  }

  .panel {
    display: flex;
    flex-grow: 1;
    flex-direction: column;
    padding: 8px 16px 16px;
    overflow: auto;
  }

  .tabs,
  .tabs > div {
    height: 100%;
    width: 100%;
  }

  .header {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-bottom: 20px;
  }

  .close-button {
    position: absolute;
    right: 20px;
    top: 20px;
    background-color: var(--primary);
    border: none;
    color: var(--foreground-on-primary);
    cursor: pointer;
    font-size: 20px;
    padding: 5px 10px;
    border: 2px solid var(--grey-dark);
    font-size: 14px;
    border-radius: 50%;
    width: 25px;
    height: 25px;
    padding: 0;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .node-name {
    padding: 5px 10px;
    resize: none;
    width: 100%;
  }

  .description-field {
    min-height: 50px;
    padding: 10px;
    width: 100%;
  }

  .input-field {
    font-family: 'Roboto Mono', monospace;
    font-size: 14px;
    background-color: var(--grey-dark);
    border: 1px solid var(--grey);
    color: var(--foreground);
  }

  .input-field:focus {
    outline: none;
    border-color: var(--primary);
  }

  .section-node {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .section-node-content {
    flex: 1 1 auto;
    min-height: 0;
    position: relative;
    display: flex;
  }

  .unknown-node {
    color: var(--primary-text);
  }

  .split-controls {
    display: grid;
    grid-template-columns: 75px 1fr;
    align-items: center;
    gap: 8px;

    > label {
      margin: 0;
    }
  }

  .split-controls-toggle > div {
    margin: 0;
    display: flex;
    align-items: center;
  }

  .variants {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .variant-select {
    min-width: 150px;
  }

  .variant-buttons {
    display: flex;
    align-items: center;
  }

  .section-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    height: 24px;
    background-color: rgba(0, 0, 0, 0.1);

    .node-id {
      font-size: 12px;
      color: var(--foreground-muted);
      font-family: 'Roboto Mono', monospace;
      padding: 0 16px;
      line-height: 24px;
      cursor: pointer;
    }
  }

  .section-global-controls {
    display: grid;
    grid-template-columns: 1fr 1fr;
    row-gap: 8px;
    column-gap: 16px;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--grey-lightish);

    form {
      margin: 0;
    }
  }

  .split-max {
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

type NodeEditorProps = { selectedNode: ChartNode; onDeselect: () => void };

export const NodeEditor: FC<NodeEditorProps> = ({ selectedNode, onDeselect }) => {
  const setNodes = useSetRecoilState(nodesState);
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>();
  const [addVariantPopupOpen, setAddVariantPopupOpen] = useState(false);

  const nodesById = useRecoilValue(nodesByIdState);
  const project = useRecoilValue(projectState);
  const connectionsForNode = useRecoilValue(connectionsForSingleNodeState(selectedNode.id));
  const setConnections = useSetRecoilState(connectionsState);

  const updateNode = useStableCallback((node: ChartNode) => {
    // Update the node
    setNodes((nodes) =>
      produce(nodes, (draft) => {
        const index = draft.findIndex((n) => n.id === node.id);
        draft[index] = node;
      }),
    );

    // Check for any invalid connections
    const instance = globalRivetNodeRegistry.createDynamicImpl(node);

    const inputDefs = instance.getInputDefinitions(connectionsForNode ?? [], nodesById, project);
    const outputDefs = instance.getOutputDefinitions(connectionsForNode ?? [], nodesById, project);

    const invalidConnections = connectionsForNode?.filter((connection) => {
      if (connection.inputNodeId === node.id) {
        return !inputDefs.find((def) => def.id === connection.inputId);
      } else {
        return !outputDefs.find((def) => def.id === connection.outputId);
      }
    });

    if (invalidConnections?.length) {
      setConnections((conns) => conns.filter((c) => !invalidConnections.includes(c)));
    }
  });

  const isVariant = selectedVariant !== undefined;

  const nodeForEditor = {
    ...selectedNode,
    data: isVariant ? selectedNode.variants?.find(({ id }) => id === selectedVariant)?.data : selectedNode.data,
  };

  const { Editor } = useUnknownNodeComponentDescriptorFor(selectedNode);

  const nodeEditor = Editor ? (
    <Editor node={nodeForEditor} onChange={isVariant ? () => {} : updateNode} />
  ) : (
    <DefaultNodeEditor node={nodeForEditor} isReadonly={isVariant} onChange={isVariant ? () => {} : updateNode} />
  );

  useHotkeys('esc', onDeselect, [onDeselect]);

  const nodeDescriptionChanged = useStableCallback((description: string) => {
    updateNode({ ...selectedNode, description });
  });

  const nodeTitleChanged = useStableCallback((title: string) => {
    updateNode({ ...selectedNode, title });
  });

  const variantOptions = useMemo(() => {
    const appliedOption = { value: '', label: '(Current)' };

    return [
      appliedOption,
      ...orderBy(selectedNode.variants?.map(({ id }) => ({ value: id, label: id })) ?? [], 'label'),
    ];
  }, [selectedNode.variants]);

  const selectedVariantOption =
    selectedVariant === undefined ? variantOptions[0] : variantOptions.find(({ value }) => value === selectedVariant);

  function handleSaveAsVariant(id: string) {
    const node = { ...selectedNode, variants: [...(selectedNode.variants ?? []), { id, data: selectedNode.data }] };
    updateNode(node);
    setSelectedVariant(id);
  }

  function handleDeleteVariant() {
    const node = {
      ...selectedNode,
      variants: selectedNode.variants?.filter(({ id }) => id !== selectedVariant),
    };
    updateNode(node);
    setSelectedVariant(undefined);
  }

  function handleApplyVariant() {
    const node = {
      ...selectedNode,
      data: selectedNode.variants?.find(({ id }) => id === selectedVariant)?.data,
    };
    updateNode(node);
    setSelectedVariant(undefined);
  }

  function updateTestGroupGraph(testGroup: NodeTestGroup, graphId: GraphId) {
    updateNode(
      produce(selectedNode, (draft) => {
        const group = draft.tests?.find(({ id }) => id === testGroup.id);
        if (group) {
          group.evaluatorGraphId = graphId;
        }
      }),
    );
  }

  function handleAddTestGroup() {
    updateNode({
      ...selectedNode,
      tests: [
        ...(selectedNode.tests ?? []),
        {
          evaluatorGraphId: '' as GraphId,
          tests: [],
          id: nanoid(),
        },
      ],
    });
  }

  const selectText = (event: MouseEvent<HTMLElement>) => {
    const range = document.createRange();
    range.selectNodeContents(event.target as HTMLElement);
    const selection = window.getSelection();
    selection!.removeAllRanges();
    selection!.addRange(range);
  };

  return (
    <Container>
      <div className="tabs">
        <Tabs id="node-editor-tabs">
          <TabList>
            <Tab>{globalRivetNodeRegistry.getDynamicDisplayName(selectedNode.type)} Node</Tab>
          </TabList>
          <TabPanel>
            <div className="panel-container">
              <div className="panel">
                <button className="close-button" onClick={onDeselect}>
                  <MultiplyIcon />
                </button>
                <div className="section section-global-controls">
                  <InlineEditableTextfield
                    key={`node-title-${selectedNode.id}`}
                    label="Node Title"
                    placeholder="Enter a name for the node..."
                    defaultValue={selectedNode.title}
                    onConfirm={nodeTitleChanged}
                    readViewFitContainerWidth
                  />
                  <InlineEditableTextfield
                    key={`node-description-${selectedNode.id}`}
                    label="Node Description"
                    defaultValue={selectedNode.description ?? ''}
                    onConfirm={nodeDescriptionChanged}
                    placeholder="Optional description..."
                    readViewFitContainerWidth
                  ></InlineEditableTextfield>

                  <Field name="isSplitRun" label="Split">
                    {({ fieldProps }) => (
                      <section className="split-controls">
                        <div className="split-controls-toggle">
                          <Toggle
                            {...fieldProps}
                            isChecked={selectedNode.isSplitRun}
                            onChange={(isSplitRun) =>
                              updateNode({ ...selectedNode, isSplitRun: isSplitRun.target.checked })
                            }
                          />
                        </div>

                        {selectedNode.isSplitRun && (
                          <div className="split-max">
                            <span>Max:</span>
                            <TextField
                              type="number"
                              placeholder="Max"
                              value={selectedNode.splitRunMax ?? 10}
                              onChange={(event) =>
                                updateNode({
                                  ...selectedNode,
                                  splitRunMax: (event.target as HTMLInputElement).valueAsNumber,
                                })
                              }
                            />
                          </div>
                        )}
                      </section>
                    )}
                  </Field>
                  <Field name="variants" label="Variant">
                    {({ fieldProps }) => (
                      <section className="variants">
                        {variantOptions.length > 1 && (
                          <Select
                            className="variant-select"
                            {...fieldProps}
                            options={variantOptions}
                            value={selectedVariantOption}
                            onChange={(val) => setSelectedVariant(val!.value === '' ? undefined : val!.value)}
                          />
                        )}

                        {isVariant ? (
                          <div className="variant-buttons">
                            <Button appearance="primary" onClick={handleApplyVariant}>
                              Apply
                            </Button>
                            <Button appearance="danger" onClick={handleDeleteVariant}>
                              Delete Variant
                            </Button>
                          </div>
                        ) : (
                          <Popup
                            isOpen={addVariantPopupOpen}
                            trigger={(triggerProps) => (
                              <Button
                                {...triggerProps}
                                appearance="subtle-link"
                                onClick={() => setAddVariantPopupOpen(!addVariantPopupOpen)}
                              >
                                Save As Variant
                              </Button>
                            )}
                            content={() => (
                              <div>
                                <Field name="variantName" label="Variant Name">
                                  {({ fieldProps }) => (
                                    <TextField
                                      {...fieldProps}
                                      placeholder="Enter a name for the variant..."
                                      onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                          handleSaveAsVariant((event.target as HTMLInputElement).value);
                                          setAddVariantPopupOpen(false);
                                        }
                                      }}
                                    />
                                  )}
                                </Field>
                              </div>
                            )}
                          />
                        )}
                      </section>
                    )}
                  </Field>
                </div>

                <div className="section section-node">
                  <div className="section-node-content">{nodeEditor}</div>
                </div>
              </div>
              <div className="section section-footer">
                <span className="node-id" onClick={selectText}>
                  {selectedNode.id}
                </span>
              </div>
            </div>
          </TabPanel>
        </Tabs>
      </div>
    </Container>
  );
};
