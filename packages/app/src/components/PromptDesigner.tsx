import Button from '@atlaskit/button';
import { css } from '@emotion/react';
import { FC, useEffect, useState, useRef, useMemo } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import {
  PromptDesignerTestGroupResults,
  promptDesignerAttachedChatNodeState,
  promptDesignerConfigurationState,
  promptDesignerMessagesState,
  promptDesignerResponseState,
  promptDesignerState,
  promptDesignerTestGroupResultsByNodeIdState,
} from '../state/promptDesigner';
import { nodesSelector } from '../state/graph';
import { lastRunDataByNodeState } from '../state/dataFlow';
import {
  ChatMessage,
  ChatNode,
  ChatNodeConfigData,
  ChatNodeImpl,
  GraphId,
  GraphProcessor,
  InternalProcessContext,
  NodeId,
  NodeTestGroup,
  PortId,
  ProcessId,
  Settings,
  coerceType,
  coerceTypeOptional,
  getChatNodeMessages,
  getError,
  modelOptions,
} from '@ironclad/rivet-core';
import TextField from '@atlaskit/textfield';
import { Field } from '@atlaskit/form';
import Tabs, { Tab, TabList, TabPanel } from '@atlaskit/tabs';
import Select from '@atlaskit/select';
import Toggle from '@atlaskit/toggle';
import { nanoid } from 'nanoid';
import { TauriNativeApi } from '../model/native/TauriNativeApi';
import { settingsState } from '../state/settings';
import { GraphSelector } from './DefaultNodeEditor';
import TextArea from '@atlaskit/textarea';
import { projectState } from '../state/savedGraphs';
import { cloneDeep, partial, range, zip } from 'lodash-es';
import produce from 'immer';

const styles = css`
  position: fixed;
  top: 32px;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--grey-darker);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  z-index: 60;

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
  }

  .message-list {
    height: 100%;
  }

  .message {
    border-bottom: 1px solid var(--grey);
    padding: 30px 10px;
    cursor: pointer;
    font-size: 14px;
    line-height: 22px;
    font-family: 'Roboto', sans-serif;

    .message-text pre {
      font-family: 'Roboto', sans-serif;
      user-select: none;
    }

    &:hover {
      background-color: var(--grey-darkest);
    }
  }

  .response-area {
    border-right: 1px solid var(--grey);
    padding: 20px;
    height: 100%;
    overflow: auto;
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
`;

export const PromptDesignerRenderer: FC = () => {
  const [{ isOpen }, setState] = useRecoilState(promptDesignerState);

  if (!isOpen) return null;

  return <PromptDesigner onClose={() => setState((s) => ({ ...s, isOpen: false }))} />;
};

export type PromptDesignerProps = {
  onClose: () => void;
};

export const PromptDesigner: FC<PromptDesignerProps> = ({ onClose }) => {
  const [{ messages }, setMessages] = useRecoilState(promptDesignerMessagesState);
  const attachedNodeId = useRecoilValue(promptDesignerAttachedChatNodeState);
  const [nodes, setNodes] = useRecoilState(nodesSelector);
  const nodeOutput = useRecoilValue(lastRunDataByNodeState);
  const [config, setConfig] = useRecoilState(promptDesignerConfigurationState);
  const [response, setResponse] = useRecoilState(promptDesignerResponseState);
  const [promptDesigner, setPromptDesigner] = useRecoilState(promptDesignerState);

  const attachedNode = useMemo(
    () => nodes.find((n) => n.id === attachedNodeId?.nodeId) as ChatNode | undefined,
    [attachedNodeId?.nodeId, nodes],
  );

  const nodeDataForAttachedNode = attachedNodeId ? nodeOutput[attachedNodeId.nodeId] : undefined;
  const nodeDataForAttachedNodeProcess = attachedNodeId
    ? nodeDataForAttachedNode?.find((n) => n.processId === attachedNodeId.processId)?.data
    : undefined;

  useEffect(() => {
    if (messages.length === 0 && nodeDataForAttachedNodeProcess?.inputData) {
      const { messages } = getChatNodeMessages(nodeDataForAttachedNodeProcess.inputData);
      setMessages({
        messages,
      });
    }
  }, [messages.length, nodeDataForAttachedNodeProcess, setMessages]);

  const testGroups = attachedNode?.tests ?? [];

  useEffect(() => {
    if (attachedNode) {
      const { data } = attachedNode;
      setConfig({
        data: {
          maxTokens: data.maxTokens,
          model: data.model,
          presencePenalty: data.presencePenalty,
          frequencyPenalty: data.frequencyPenalty,
          temperature: data.temperature,
          useTopP: data.useTopP,
          enableToolUse: data.enableToolUse,
          numberOfChoices: data.numberOfChoices,
          stop: data.stop,
          top_p: data.top_p,
          user: data.user,
        },
      });
    }
  }, [attachedNode, setConfig]);

  const attachedNodeChanged = (newNode: ChatNode) => {
    setNodes((s) => s.map((n) => (n.id === newNode.id ? newNode : n)));
  };

  const messageChanged = (newMessage: ChatMessage, index: number) => {
    setMessages((s) => ({
      ...s,
      messages: s.messages.map((m, i) => (i === index ? newMessage : m)),
    }));
  };

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

  const settings = useRecoilValue(settingsState);

  const abortController = useRef<AbortController>();
  const [inProgress, setInProgress] = useState(false);

  const tryRunSingle = async () => {
    try {
      abortController.current?.abort();
      abortController.current = new AbortController();
      setInProgress(true);
      setResponse({});

      if (attachedNodeId?.nodeId) {
        setTestGroupResultsByNodeId((s) => ({ ...s, [attachedNodeId.nodeId]: [] }));
      }

      const response = await runAdHocChat(messages, {
        data: config.data,
        signal: abortController.current.signal,
        settings,
        onPartialResult: (partialResult) => {
          setResponse({
            response: partialResult,
          });
        },
      });

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
          data: config.data,
          settings,
          signal: abortController.current.signal,
        },
        {
          onPartialResults: (partialResult) => {
            setTestGroupResultsByNodeId((s) => ({
              ...s,
              [attachedNodeId.nodeId]: partialResult,
            }));
          },
        },
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
            {messages.map((message, index) => (
              <PromptDesignerMessage
                message={message}
                key={`message-${index}`}
                onChange={(newMessage) => messageChanged(newMessage, index)}
              />
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
                          options={modelOptions}
                          value={modelOptions.find((o) => o.value === config.data.model)!}
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

const PromptDesignerMessage: FC<{
  message: ChatMessage;
  onChange: (message: ChatMessage) => void;
}> = ({ message, onChange }) => {
  const [editing, setEditing] = useState(false);
  const [uneditedTextHeight, setUneditedTextHeight] = useState<number | undefined>();

  const [editingText, setEditingText] = useState(message.message);

  const toggleEditing = () => {
    setEditing(!editing);

    if (editing) {
      onChange({
        ...message,
        message: editingText,
      });
    } else {
      setEditingText(message.message);
    }
  };

  return (
    <div className="message" onClick={toggleEditing}>
      <div className="message-text">
        {editing ? (
          <textarea
            autoFocus
            className="message-editor"
            value={editingText}
            style={{ height: uneditedTextHeight ?? 300 }}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setEditingText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                toggleEditing();
              }
            }}
          />
        ) : (
          <pre
            className="pre-wrap"
            ref={(elem) => {
              if (elem) {
                setUneditedTextHeight(elem.clientHeight);
              }
            }}
          >
            {message.message}
          </pre>
        )}
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

type AdHocChatConfig = {
  data: ChatNodeConfigData;
  signal: AbortSignal;
  settings: Settings;
  onPartialResult?: (response: string) => void;
};

async function runAdHocChat(messages: ChatMessage[], config: AdHocChatConfig) {
  const { data, signal, settings, onPartialResult } = config;

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

  const result = await chatNode.process(
    {
      ['prompt' as PortId]: {
        type: 'chat-message[]',
        value: messages,
      },
    },
    {
      contextValues: {},
      createSubProcessor: undefined!,
      settings,
      nativeApi: new TauriNativeApi(),
      processId: nanoid() as ProcessId,
      executionCache: new Map(),
      externalFunctions: {},
      getGlobal: undefined!,
      graphInputs: {},
      graphOutputs: {},
      project: undefined!,
      raiseEvent: undefined!,
      setGlobal: undefined!,
      signal,
      trace: (value) => console.log(value),
      waitEvent: undefined!,
      waitForGlobal: undefined!,
      onPartialOutputs: (outputs) => {
        const responsePartial = coerceTypeOptional(outputs['response' as PortId], 'string');
        if (responsePartial) {
          onPartialResult?.(responsePartial);
        }
      },
    } as InternalProcessContext,
  );

  const response = coerceTypeOptional(result['response' as PortId], 'string');
  return response ?? '';
}

function useRunTestGroup() {
  const project = useRecoilValue(projectState);
  const settings = useRecoilValue(settingsState);

  return async (
    testGroup: NodeTestGroup,
    messages: ChatMessage[],
    config: AdHocChatConfig,
  ): Promise<PromptDesignerTestGroupResults> => {
    const response = await runAdHocChat(messages, config);

    const processor = new GraphProcessor(project, testGroup.evaluatorGraphId);

    processor.on('trace', (value) => console.log(value));

    processor.on('nodeFinish', ({ node, outputs }) => {
      if (node.type === 'chat') {
        console.log(outputs['response' as PortId]);
      }
    });

    const outputs = await processor.processGraph(
      {
        nativeApi: new TauriNativeApi(),
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

  return async (
    testGroup: NodeTestGroup,
    messages: ChatMessage[],
    sampleCount: number,
    config: AdHocChatConfig,
    options: {
      onPartialResults?: (data: PromptDesignerTestGroupResults[]) => void;
    } = {},
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

        const caseResults = await runTestGroup(testGroup, messages, {
          ...config,
          onPartialResult: (response) => {
            results[sampleIndex]!.response = response;
            onPartialResults?.(cloneDeep(results));
          },
        });

        results[sampleIndex]!.results = caseResults.results;

        onPartialResults?.(cloneDeep(results));
      }),
    );

    return results;
  };
}
