import { FC, useEffect, useMemo, useState } from 'react';
import { editingNodeState } from '../state/graphBuilder';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { nodesSelector } from '../state/graph';
import styled from '@emotion/styled';
import { ReactComponent as MultiplyIcon } from 'majesticons/line/multiply-line.svg';
import { NodeType, getNodeDisplayName, ChartNode } from '@ironclad/rivet-core';
import { useUnknownNodeComponentDescriptorFor } from '../hooks/useNodeTypes';
import produce from 'immer';
import { InlineEditableTextfield } from '@atlaskit/inline-edit';
import Toggle from '@atlaskit/toggle';
import { useStableCallback } from '../hooks/useStableCallback';
import { DefaultNodeEditor } from './DefaultNodeEditor';
import Tabs, { Tab, TabList, TabPanel } from '@atlaskit/tabs';
import { Field, Label } from '@atlaskit/form';
import TextField from '@atlaskit/textfield';
import Select from '@atlaskit/select';
import Button from '@atlaskit/button';
import Popup from '@atlaskit/popup';
import { orderBy } from 'lodash-es';

export const NodeEditorRenderer: FC = () => {
  const nodes = useRecoilValue(nodesSelector);
  const [editingNodeId, setEditingNodeId] = useRecoilState(editingNodeState);

  const deselect = useStableCallback(() => {
    setEditingNodeId(null);
  });

  const selectedNode = nodes.find((node) => node.id === editingNodeId);

  if (!editingNodeId || !selectedNode) {
    return null;
  }

  return <NodeEditor selectedNode={selectedNode} onDeselect={deselect} />;
};

const Container = styled.div`
  position: absolute;
  top: 32px;
  right: 0;
  bottom: 0;
  width: 45%;
  max-width: 1000px;
  min-width: 500px;

  .panel {
    display: flex;
    flex-direction: column;
    overflow: auto;
    padding: 8px 16px 16px;
    color: var(--foreground);
    background-color: rgba(40, 44, 52, 0.75);
    font-family: 'Roboto Mono', monospace;
    width: 100%;
    box-shadow: -4px 0 3px rgba(0, 0, 0, 0.1);
    border-left: 1px solid var(--grey);
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
    color: var(--grey-dark);
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

  .section-title {
    color: var(--foreground-bright);
    font-size: 20px;
    margin-bottom: 10px;
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

  .section-name-description {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: start;
    column-gap: 16px;

    > form {
      margin: 0;
    }
  }

  .section-node {
    flex-grow: 1;

    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .section-node-content {
    flex-grow: 1;
    position: relative;
    display: flex;
  }

  .unknown-node {
    color: var(--primary);
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
`;

type NodeEditorProps = { selectedNode: ChartNode; onDeselect: () => void };

export const NodeEditor: FC<NodeEditorProps> = ({ selectedNode, onDeselect }) => {
  const setNodes = useSetRecoilState(nodesSelector);
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>();
  const [addVariantPopupOpen, setAddVariantPopupOpen] = useState(false);

  const updateNode = useStableCallback((node: ChartNode) => {
    setNodes((nodes) =>
      produce(nodes, (draft) => {
        const index = draft.findIndex((n) => n.id === node.id);
        draft[index] = node;
      }),
    );
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDeselect?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onDeselect]);

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

  return (
    <Container>
      <div className="tabs">
        <Tabs id="node-editor-tabs">
          <TabList>
            <Tab>{getNodeDisplayName(selectedNode.type as NodeType)} Node</Tab>
            <Tab>Test Cases</Tab>
          </TabList>
          <TabPanel>
            <div className="panel">
              <button className="close-button" onClick={onDeselect}>
                <MultiplyIcon />
              </button>
              <div className="section section-name-description">
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
                  placeholder="Enter any description or notes for this node..."
                  readViewFitContainerWidth
                ></InlineEditableTextfield>
              </div>
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
                      <TextField
                        type="number"
                        placeholder="Max"
                        value={selectedNode.splitRunMax ?? 10}
                        onChange={(event) =>
                          updateNode({ ...selectedNode, splitRunMax: (event.target as HTMLInputElement).valueAsNumber })
                        }
                      />
                    )}
                  </section>
                )}
              </Field>
              <Field name="variants" label="Variant">
                {({ fieldProps }) => (
                  <section className="variants">
                    <Select
                      className="variant-select"
                      {...fieldProps}
                      options={variantOptions}
                      value={selectedVariantOption}
                      onChange={(val) => setSelectedVariant(val!.value === '' ? undefined : val!.value)}
                    />

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
              <div className="section section-node">
                <div className="section-node-content">{nodeEditor}</div>
              </div>
            </div>
          </TabPanel>
        </Tabs>
      </div>
    </Container>
  );
};
