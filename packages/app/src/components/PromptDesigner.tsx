import Button from '@atlaskit/button';
import { css } from '@emotion/react';
import { type ChangeEvent, type FC, useEffect, useState, useRef, useLayoutEffect } from 'react';
import { atom, useRecoilState, useRecoilValue } from 'recoil';
import {
  type PromptDesignerTestGroupResults,
  promptDesignerAttachedChatNodeState,
  promptDesignerConfigurationState,
  promptDesignerMessagesState,
  promptDesignerResponseState,
  promptDesignerState,
  promptDesignerTestGroupResultsByNodeIdState,
} from '../state/promptDesigner';
import { nodesByIdState, nodesState } from '../state/graph.js';
import { lastRunDataByNodeState } from '../state/dataFlow.js';
import {
  type ChatMessage,
  type ChatNode,
  type ChatNodeConfigData,
  ChatNodeImpl,
  type GraphId,
  GraphProcessor,
  type InternalProcessContext,
  type NodeId,
  type NodeTestGroup,
  type PortId,
  arrayizeDataValue,
  coerceType,
  coerceTypeOptional,
  getChatNodeMessages,
  getError,
  isArrayDataValue,
  openai,
} from '@ironclad/rivet-core';
import TextField from '@atlaskit/textfield';
import { Field } from '@atlaskit/form';
import Tabs, { Tab, TabList, TabPanel } from '@atlaskit/tabs';
import Select from '@atlaskit/select';
import Toggle from '@atlaskit/toggle';
import { nanoid } from 'nanoid/non-secure';
import { TauriNativeApi } from '../model/native/TauriNativeApi.js';
import { settingsState } from '../state/settings.js';
import TextArea from '@atlaskit/textarea';
import { projectState } from '../state/savedGraphs.js';
import { cloneDeep, findIndex, mapValues, range, zip } from 'lodash-es';
import { useStableCallback } from '../hooks/useStableCallback.js';
import { toast } from 'react-toastify';
import { produce } from 'immer';
import { overlayOpenState } from '../state/ui';
import { datasetProvider } from '../utils/globals';
import { GraphSelector } from './editors/GraphSelectorEditor';
import { useGetAdHocInternalProcessContext } from '../hooks/useGetAdHocInternalProcessContext';

const styles = css`
  position: fixed;
  top: var(--project-selector-height);
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--grey-darker);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  z-index: 150;

  .close-prompt-designer {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 10;
    cursor: pointer;
  }

  .prompt-designer-content {
    display: grid;
    grid-template-columns: 2fr 2fr 1fr;
    height: 100%;
  }

  .message-area {
    border-right: 1px solid var(--grey);
    padding: 20px;
    height: 100%;
    min-height: 0;
    overflow: auto;
    padding-top: 32px;
  }

  .message-list {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .message {
    border-bottom: 1px solid var(--grey);
    padding: 10px 5px;
    cursor: pointer;
    font-size: 14px;
    line-height: 22px;
    font-family: 'Roboto', sans-serif;
    display: flex;
    flex-direction: column;
    position: relative;
    gap: 8px;

    .message-author-type {
      width: 100px;
    }

    .message-text {
      width: 100%;
    }

    .message-delete-button-container {
      width: 40px;
      position: absolute;
      top: 10px;
      right: 5px;
    }

    .message-text pre {
      font-family: 'Roboto', sans-serif;
      user-select: none;
    }
  }

  .response-area {
    border-right: 1px solid var(--grey);
    padding: 20px;
    height: 100%;
    overflow: auto;
    padding-top: 32px;
  }

  .controls-area {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .panel {
    width: 100%;
    height: 100%;
  }

  .controls-buttons {
    padding: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .message-editor {
    width: 100%;
    font-size: 14px;
    font-family: 'Roboto', sans-serif;
    line-height: 22px;
    resize: none;
    overflow: hidden;
    border: solid 1px transparent;
    background: transparent;
    outline: none;
    padding: 10px;
    &:focus {
      border: solid 1px var(--grey-lightest);
    }

    &:hover {
      background-color: rgba(0, 0, 0, 0.1);
    }
  }

  .chat-config-area {
    display: grid;
    height: 100%;
    grid-template-rows: 1fr auto;
  }

  .chat-config-controls {
    padding: 20px;
    border-bottom: 1px solid var(--grey);
  }

  .test-config-area {
    display: grid;
    grid-template-rows: auto 1fr;
    height: 100%;
  }

  .test-config {
    padding: 20px;
    border-bottom: 1px solid var(--grey);
  }

  .test-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    border-bottom: 1px solid var(--grey);
  }

  .test-group {
    border-bottom: 1px solid var(--grey);
    padding: 10px;
    position: relative;
  }

  .test-group-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;
  }

  .delete-test-group-button {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 10;
  }

  .test-group-tests {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 16px;
  }

  .test-group-test-controls {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .test-group-result {
    border: 1px solid var(--grey);
    border-radius: 10px;
    padding: 10px;
    position: relative;
  }

  .test-group-result-response {
    max-height: 300px;
    overflow: auto;
    border-bottom: 1px solid var(--grey);
  }

  .test-group-result-conditions {
    padding: 10px;

    .test-group-result-condition-result {
      display: flex;
      gap: 8px;
      align-items: center;

      .pass {
        color: var(--success);
      }

      .fail {
        color: var(--error);
      }
    }
  }

  .test-group-results {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .test-group-result-expand {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 10;
  }

  .add-message {
    justify-self: stretch;
    display: flex;
    justify-content: center;
    font-size: 12px;

    &:hover {
      background-color: rgba(0, 0, 0, 0.1);
    }
  }
`;

export const PromptDesignerRenderer: FC = () => {
  const [openOverlay, setOpenOverlay] = useRecoilState(overlayOpenState);

  if (openOverlay !== 'promptDesigner') {
    return null;
  }

  return <PromptDesigner onClose={() => setOpenOverlay(undefined)} />;
};

export type PromptDesignerProps = {
  onClose: () => void;
};

const lastPromptDesignerAttachedNodeState = atom<NodeId | undefined>({
  key: 'lastPromptDesignerAttachedNodeState',
  default: undefined,
});

export const PromptDesigner: FC<PromptDesignerProps> = ({ onClose }) => {
  const [{ messages }, setMessages] = useRecoilState(promptDesignerMessagesState);
  const attachedNodeId = useRecoilValue(promptDesignerAttachedChatNodeState);
  const [, setNodes] = useRecoilState(nodesState);
  const nodeOutput = useRecoilValue(lastRunDataByNodeState);
  const [config, setConfig] = useRecoilState(promptDesignerConfigurationState);
  const [response, setResponse] = useRecoilState(promptDesignerResponseState);
  const [promptDesigner, setPromptDesigner] = useRecoilState(promptDesignerState);
  const nodesById = useRecoilValue(nodesByIdState);

  const attachedNode = attachedNodeId?.nodeId ? (nodesById[attachedNodeId.nodeId] as ChatNode) : undefined;

  const testGroups = attachedNode?.tests ?? [];

  const [lastPromptDesignerAttachedNode, setLastPromptDesignerAttachedNode] = useRecoilState(
    lastPromptDesignerAttachedNodeState,
  );

  useEffect(() => {
    if (!attachedNode || lastPromptDesignerAttachedNode === attachedNode.id) {
      return;
    }

    const { data } = attachedNode;
    setConfig({
      data: {
        maxTokens: data.maxTokens,
        model: data.model,
        presencePenalty: data.presencePenalty,
        frequencyPenalty: data.frequencyPenalty,
        temperature: data.temperature,
        useTopP: data.useTopP,
        enableFunctionUse: data.enableFunctionUse,
        numberOfChoices: data.numberOfChoices,
        stop: data.stop,
        top_p: data.top_p,
        user: data.user,
      },
    });

    const nodeDataForAttachedNode = attachedNodeId ? nodeOutput[attachedNodeId.nodeId] : undefined;
    const nodeDataForAttachedNodeProcess = attachedNodeId
      ? nodeDataForAttachedNode?.find((n) => n.processId === attachedNodeId.processId)?.data
      : undefined;

    if (nodeDataForAttachedNodeProcess?.inputData) {
      let inputData = nodeDataForAttachedNodeProcess.inputData;
      // If node is a split run, just grab the first input data.
      if (attachedNode.isSplitRun) {
        inputData = mapValues(inputData, (val) => (isArrayDataValue(val) ? arrayizeDataValue(val)[0] : val));
      }
      const { messages } = getChatNodeMessages(inputData);
      setMessages({
        messages,
      });
    }

    setLastPromptDesignerAttachedNode(attachedNode.id);
  }, [
    attachedNode,
    attachedNodeId,
    nodeOutput,
    setConfig,
    setMessages,
    lastPromptDesignerAttachedNode,
    setLastPromptDesignerAttachedNode,
  ]);

  const attachedNodeChanged = (newNode: ChatNode) => {
    setNodes((s) => s.map((n) => (n.id === newNode.id ? newNode : n)));
  };

  const messageChanged = (newMessage: ChatMessage, index: number) => {
    setMessages((s) => ({
      ...s,
      messages: s.messages.map((m, i) => (i === index ? newMessage : m)),
    }));
  };

  const deleteMessage = useStableCallback((index: number) => {
    setMessages((s) => ({
      ...s,
      messages: [...s.messages.slice(0, index), ...s.messages.slice(index + 1)],
    }));
  });

  const addMessage = useStableCallback((index: number) => {
    setMessages((s) =>
      produce(s, (draft) => {
        draft.messages.splice(index + 1, 0, { type: 'user', message: '' });
      }),
    );
  });

  const testGroupChanged = (newTestGroup: NodeTestGroup, index: number) => {
    if (!attachedNode) {
      return;
    }

    attachedNodeChanged({
      ...attachedNode,
      tests: (attachedNode.tests ?? []).map((t, i) => (i === index ? newTestGroup : t)),
    });
  };

  const addTestGroup = () => {
    if (!attachedNode) {
      return;
    }

    attachedNodeChanged({
      ...attachedNode,
      tests: [
        ...(attachedNode.tests ?? []),
        {
          id: nanoid() as NodeId,
          tests: [],
          evaluatorGraphId: '' as GraphId,
        },
      ],
    });
  };

  const deleteTestGroup = (index: number) => {
    if (!attachedNode) {
      return;
    }

    attachedNodeChanged({
      ...attachedNode,
      tests: (attachedNode.tests ?? []).filter((_, i) => i !== index),
    });
  };

  const runTestGroup = useRunTestGroupSampleCount();

  const [testGroupResultsByNodeId, setTestGroupResultsByNodeId] = useRecoilState(
    promptDesignerTestGroupResultsByNodeIdState,
  );

  const resultsForAttachedNode = testGroupResultsByNodeId[attachedNodeId?.nodeId ?? ''];

  const abortController = useRef<AbortController>();
  const [inProgress, setInProgress] = useState(false);

  const getAdHocInternalProcessContext = useGetAdHocInternalProcessContext();

  const tryRunSingle = async () => {
    try {
      abortController.current?.abort();
      abortController.current = new AbortController();
      setInProgress(true);
      setResponse({});

      if (attachedNodeId?.nodeId) {
        setTestGroupResultsByNodeId((s) => ({ ...s, [attachedNodeId.nodeId]: [] }));
      }

      const response = await runAdHocChat(
        messages,
        config.data,
        await getAdHocInternalProcessContext({
          onPartialResult: (partialResult) => {
            setResponse({ response: partialResult });
          },
          signal: abortController.current.signal,
        }),
      );

      setResponse({
        response,
      });
    } catch (err) {
      console.error(getError(err));
    } finally {
      abortController.current = undefined;
      setInProgress(false);
    }
  };

  const handleStartTestGroup = async (testGroup: NodeTestGroup) => {
    if (!attachedNodeId?.nodeId) {
      return;
    }

    abortController.current?.abort();
    abortController.current = new AbortController();
    setInProgress(true);
    setResponse({});
    setTestGroupResultsByNodeId((s) => ({ ...s, [attachedNodeId.nodeId]: [] }));

    try {
      await runTestGroup(
        testGroup,
        messages,
        promptDesigner.samples,
        {
          onPartialResults: (partialResults) => {
            setTestGroupResultsByNodeId((s) => ({
              ...s,
              [attachedNodeId.nodeId]: partialResults,
            }));
          },
        },
        config.data,
      );
    } catch (err) {
      console.error(getError(err));
    } finally {
      abortController.current = undefined;
      setInProgress(false);
    }
  };

  const handleCancel = () => {
    abortController.current?.abort();
    abortController.current = undefined;
    setInProgress(false);
  };

  return (
    <div css={styles}>
      <Button className="close-prompt-designer" appearance="subtle" onClick={onClose}>
        &times;
      </Button>

      <div className="prompt-designer-content">
        <div className="message-area">
          <div className="message-list">
            <Button
              key="add-message-first"
              className="add-message"
              appearance="subtle-link"
              onClick={() => addMessage(-1)}
            >
              + Add message
            </Button>
            {messages.map((message, index) => (
              <>
                <PromptDesignerMessage
                  message={message}
                  key={`message-${index}`}
                  onChange={(newMessage) => messageChanged(newMessage, index)}
                  onDelete={() => deleteMessage(index)}
                />
                <Button
                  key={`add-message-${index}`}
                  className="add-message"
                  appearance="subtle-link"
                  onClick={() => addMessage(index)}
                >
                  + Add message
                </Button>
              </>
            ))}
          </div>
        </div>
        <div className="response-area">
          {resultsForAttachedNode?.length ? (
            <PromptDesignerTestGroupResultList results={resultsForAttachedNode} />
          ) : (
            <pre className="pre-wrap response-text">{response.response ?? ''}</pre>
          )}
        </div>
        <div className="controls-area">
          <Tabs id="prompt-designer-tabs">
            <TabList>
              <Tab>Config</Tab>
              <Tab>Test</Tab>
            </TabList>
            <TabPanel>
              <div className="panel">
                <div className="chat-config-area">
                  <div className="chat-config-controls">
                    <Field name="model" label="Model">
                      {({ fieldProps }) => (
                        <Select
                          {...fieldProps}
                          options={openai.openAiModelOptions}
                          value={openai.openAiModelOptions.find((o) => o.value === config.data.model)!}
                          placeholder="Select a model"
                          onChange={(value) => setConfig((s) => ({ ...s, data: { ...s.data, model: value!.value } }))}
                        />
                      )}
                    </Field>
                    <Field name="temperature" label="Temperature">
                      {({ fieldProps }) => (
                        <TextField
                          {...fieldProps}
                          placeholder="Enter temperature"
                          type="number"
                          value={config.data.temperature}
                          min={0}
                          max={1}
                          step={0.1}
                          onChange={(e) =>
                            setConfig((s) => ({
                              ...s,
                              data: { ...s.data, temperature: (e.target as HTMLInputElement).valueAsNumber },
                            }))
                          }
                        />
                      )}
                    </Field>
                    <Field name="useTopP" label="Use Top P">
                      {({ fieldProps }) => (
                        <Toggle
                          {...fieldProps}
                          isChecked={config.data.useTopP}
                          onChange={(e) =>
                            setConfig((s) => ({
                              ...s,
                              data: { ...s.data, useTopP: (e.target as HTMLInputElement).checked },
                            }))
                          }
                        />
                      )}
                    </Field>
                    <Field name="topP" label="Top P">
                      {({ fieldProps }) => (
                        <TextField
                          {...fieldProps}
                          placeholder="Enter top p"
                          type="number"
                          value={config.data.top_p ?? 0}
                          min={0}
                          max={1}
                          step={0.1}
                          onChange={(e) =>
                            setConfig((s) => ({
                              ...s,
                              data: { ...s.data, topP: (e.target as HTMLInputElement).valueAsNumber },
                            }))
                          }
                        />
                      )}
                    </Field>
                    <Field name="max-tokens" label="Max Tokens">
                      {({ fieldProps }) => (
                        <TextField
                          {...fieldProps}
                          placeholder="Enter max tokens"
                          type="number"
                          min={1}
                          max={100}
                          value={config.data.maxTokens}
                          onChange={(e) =>
                            setConfig((s) => ({
                              ...s,
                              data: { ...s.data, maxTokens: (e.target as HTMLInputElement).valueAsNumber },
                            }))
                          }
                        />
                      )}
                    </Field>
                    <Field name="frequencyPenalty" label="Frequency Penalty">
                      {({ fieldProps }) => (
                        <TextField
                          {...fieldProps}
                          placeholder="Enter frequency penalty"
                          type="number"
                          min={0}
                          max={100}
                          value={config.data.frequencyPenalty ?? 0}
                          onChange={(e) =>
                            setConfig((s) => ({
                              ...s,
                              data: { ...s.data, frequencyPenalty: (e.target as HTMLInputElement).valueAsNumber },
                            }))
                          }
                        />
                      )}
                    </Field>
                    <Field name="presencePenalty" label="Presence Penalty">
                      {({ fieldProps }) => (
                        <TextField
                          {...fieldProps}
                          placeholder="Enter presence penalty"
                          type="number"
                          min={0}
                          max={100}
                          value={config.data.presencePenalty ?? 0}
                          onChange={(e) =>
                            setConfig((s) => ({
                              ...s,
                              data: { ...s.data, presencePenalty: (e.target as HTMLInputElement).valueAsNumber },
                            }))
                          }
                        />
                      )}
                    </Field>
                  </div>
                  <div className="controls-buttons">
                    <Button appearance="primary" onClick={tryRunSingle}>
                      Run
                    </Button>
                  </div>
                </div>
              </div>
            </TabPanel>
            <TabPanel>
              <div className="panel">
                <div className="test-config-area">
                  <div className="test-config">
                    <Field name="test-samples" label="Samples">
                      {({ fieldProps }) => (
                        <TextField
                          {...fieldProps}
                          placeholder="Enter number of samples"
                          type="number"
                          min={1}
                          max={100}
                          value={promptDesigner.samples}
                          onChange={(e) =>
                            setPromptDesigner((s) => ({
                              ...s,
                              samples: (e.target as HTMLInputElement).valueAsNumber,
                            }))
                          }
                        />
                      )}
                    </Field>
                  </div>
                  <div className="test-list">
                    {testGroups.map((testGroup, index) => (
                      <PromptDesignerTestGroup
                        testGroup={testGroup}
                        key={`test-${index}`}
                        onChange={(newTestGroup) => testGroupChanged(newTestGroup, index)}
                        onDelete={() => deleteTestGroup(index)}
                        onStart={handleStartTestGroup}
                        inProgress={inProgress}
                        onCancel={handleCancel}
                      />
                    ))}
                    <Button className="add-test" appearance="subtle-link" onClick={addTestGroup}>
                      Add Test Group
                    </Button>
                  </div>
                </div>
              </div>
            </TabPanel>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

const CHAT_MESSAGE_TYPES = ['user', 'assistant', 'system', 'function'] as const;

const PromptDesignerMessage: FC<{
  message: ChatMessage;
  onChange: (message: ChatMessage) => void;
  onDelete: () => void;
}> = ({ message, onChange, onDelete }) => {
  const toggleAuthorType = useStableCallback(() => {
    const idx = findIndex(CHAT_MESSAGE_TYPES, (type) => message.type === type);
    const nextMessageType = CHAT_MESSAGE_TYPES[(idx + 1) % CHAT_MESSAGE_TYPES.length]!;
    onChange({
      ...message,
      type: nextMessageType,
    } as ChatMessage);
  });

  const onTextChange = useStableCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...message,
      message: e.target.value,
    });
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (textarea != null && textarea.scrollHeight > 0) {
      textarea.style.marginBottom = textarea.style.height ?? '10px';
      textarea.style.height = 'inherit';
      textarea.style.height = `${textarea.scrollHeight + 10}px`;
      textarea.style.marginBottom = 'unset';
    }
  }, [message?.message]);

  const stringMessage = coerceType({ type: 'chat-message', value: message }, 'string');

  return (
    <div className="message">
      <div className="message-author-type">
        <Button className="toggle-author-type" onClick={toggleAuthorType}>
          {message.type}
        </Button>
      </div>
      <div className="message-text">
        <textarea
          autoFocus
          className="message-editor"
          value={stringMessage}
          onClick={(e) => e.stopPropagation()}
          onChange={onTextChange}
          ref={textareaRef}
        />
      </div>
      <div className="message-delete-button-container">
        <Button appearance="subtle" className="message-delete-button" onClick={onDelete}>
          &times;
        </Button>
      </div>
    </div>
  );
};

const PromptDesignerTestGroup: FC<{
  testGroup: NodeTestGroup;
  onChange: (testGroup: NodeTestGroup) => void;
  onStart: (testGroup: NodeTestGroup) => void;
  onDelete: (testGroup: NodeTestGroup) => void;
  inProgress: boolean;
  onCancel?: () => void;
}> = ({ testGroup, onChange, onStart, onDelete, inProgress, onCancel }) => {
  return (
    <div className="test-group">
      <Button appearance="subtle" className="delete-test-group-button" onClick={() => onDelete(testGroup)}>
        &times;
      </Button>
      <GraphSelector
        label="Evaluator Graph"
        value={testGroup.evaluatorGraphId}
        onChange={(selected) => onChange({ ...testGroup, evaluatorGraphId: selected as GraphId })}
        isReadonly={false}
        name={`evaluator-graph-${testGroup.id}`}
      />
      <div className="test-group-tests">
        {testGroup.tests.map((test, index) => (
          <div className="test-group-test" key={`test-${index}`}>
            <div className="test-group-test-controls">
              <TextArea
                placeholder="Enter test condition"
                value={test.conditionText}
                onChange={(e) =>
                  onChange({
                    ...testGroup,
                    tests: testGroup.tests.map((t, i) =>
                      i === index ? { ...t, conditionText: (e.target as HTMLTextAreaElement).value } : t,
                    ),
                  })
                }
              />
              <Button
                appearance="subtle"
                className="delete-test-button"
                onClick={() =>
                  onChange({
                    ...testGroup,
                    tests: testGroup.tests.filter((t, i) => i !== index),
                  })
                }
              >
                &times;
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="test-group-buttons">
        <Button
          appearance="subtle-link"
          onClick={() =>
            onChange({
              ...testGroup,
              tests: [
                ...testGroup.tests,
                {
                  conditionText: '',
                },
              ],
            })
          }
        >
          Add Test
        </Button>
        {inProgress ? (
          <Button appearance="danger" onClick={onCancel}>
            Cancel
          </Button>
        ) : (
          <Button appearance="primary" onClick={() => onStart(testGroup)}>
            Start
          </Button>
        )}
      </div>
    </div>
  );
};

export const PromptDesignerTestGroupResultList: FC<{
  results: PromptDesignerTestGroupResults[];
}> = ({ results }) => {
  return (
    <div className="test-group-results">
      {results.map((result, index) => (
        <PromptDesignerTestGroupResult key={`result-${index}`} result={result} index={index} />
      ))}
    </div>
  );
};

export const PromptDesignerTestGroupResult: FC<{
  result: PromptDesignerTestGroupResults;
  index: number;
}> = ({ result, index }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="test-group-result">
      <header>Sample {index + 1}</header>
      <Button appearance="subtle" className="test-group-result-expand" onClick={() => setExpanded(!expanded)}>
        {expanded ? 'Hide' : 'Show'} Response
      </Button>
      {expanded && <pre className="pre-wrap test-group-result-response">{result.response}</pre>}
      <div className="test-group-result-conditions">
        {result.results.map((r, index) => (
          <div key={`result-${index}`} className="test-group-result-condition-result">
            {r.pass ? <span className="pass">Pass</span> : <span className="fail">Fail</span>}
            <span className="condition">{r.conditionText}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

async function runAdHocChat(messages: ChatMessage[], data: ChatNodeConfigData, context: InternalProcessContext) {
  const chatNode = new ChatNodeImpl({
    data: {
      ...data,
      cache: false,
      useFrequencyPenaltyInput: false,
      usePresencePenaltyInput: false,
      useMaxTokensInput: false,
      useStopInput: false,
      useStop: false,
      useTemperatureInput: false,
      useModelInput: false,
      useTopPInput: false,
      useUseTopPInput: false,
    },
    id: nanoid() as NodeId,
    title: 'N/A',
    type: 'chat',
    visualData: {
      x: 0,
      y: 0,
    },
  });

  try {
    const result = await chatNode.process(
      {
        ['prompt' as PortId]: {
          type: 'chat-message[]',
          value: messages,
        },
      },
      context,
    );

    const response = coerceTypeOptional(result['response' as PortId], 'string');
    return response ?? '';
  } catch (err) {
    toast.error((err as Error).message);
    throw err;
  }
}

function useRunTestGroup() {
  const project = useRecoilValue(projectState);
  const settings = useRecoilValue(settingsState);

  return async (
    testGroup: NodeTestGroup,
    messages: ChatMessage[],
    data: ChatNodeConfigData,
    context: InternalProcessContext,
  ): Promise<PromptDesignerTestGroupResults> => {
    const response = await runAdHocChat(messages, data, context);

    const processor = new GraphProcessor(project, testGroup.evaluatorGraphId);
    processor.executor = 'browser';

    processor.on('trace', (value) => console.log(value));

    processor.on('nodeFinish', ({ node, outputs }) => {
      if (node.type === 'chat') {
        console.log(outputs['response' as PortId]);
      }
    });

    const outputs = await processor.processGraph(
      {
        nativeApi: new TauriNativeApi(),
        datasetProvider,
        settings,
      },
      {
        ['conditions' as PortId]: {
          type: 'string[]',
          value: testGroup.tests.map((t) => t.conditionText),
        },
        ['input' as PortId]: {
          type: 'string',
          value: response,
        },
      },
    );

    const output = outputs['output' as PortId];

    if (!output || output?.type === 'control-flow-excluded') {
      return {
        groupId: testGroup.id,
        response,
        results: testGroup.tests.map(({ conditionText }): PromptDesignerTestGroupResults['results'][number] => ({
          conditionText,
          pass: false,
        })),
      };
    }

    const passOrFails = coerceType(output, 'boolean[]');

    const caseResults = zip(testGroup.tests, passOrFails).map(
      ([test, passOrFail]): PromptDesignerTestGroupResults['results'][number] => ({
        conditionText: test?.conditionText ?? '',
        pass: passOrFail ?? false,
      }),
    );

    return {
      response,
      groupId: testGroup.id,
      results: caseResults,
    };
  };
}

function useRunTestGroupSampleCount() {
  const runTestGroup = useRunTestGroup();
  const getAdHocInternalProcessContext = useGetAdHocInternalProcessContext();

  return async (
    testGroup: NodeTestGroup,
    messages: ChatMessage[],
    sampleCount: number,
    options: {
      onPartialResults?: (data: PromptDesignerTestGroupResults[]) => void;
    } = {},
    data: ChatNodeConfigData,
  ): Promise<PromptDesignerTestGroupResults[]> => {
    const { onPartialResults } = options;

    const results: PromptDesignerTestGroupResults[] = [];

    // TODO queue

    await Promise.all(
      range(sampleCount).map(async (sampleIndex) => {
        results[sampleIndex] = {
          response: '',
          groupId: testGroup.id,
          results: [],
        };

        const caseResults = await runTestGroup(
          testGroup,
          messages,
          data,
          await getAdHocInternalProcessContext({
            onPartialResult: (response) => {
              results[sampleIndex]!.response = response;
              onPartialResults?.(cloneDeep(results));
            },
          }),
        );

        results[sampleIndex]!.results = caseResults.results;

        onPartialResults?.(cloneDeep(results));
      }),
    );

    return results;
  };
}
