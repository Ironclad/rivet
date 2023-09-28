import Modal, { ModalTransition, ModalBody, ModalHeader, ModalFooter, ModalTitle } from '@atlaskit/modal-dialog';
import { type FC, useState } from 'react';
import Select from '@atlaskit/select';
import TextField from '@atlaskit/textfield';
import { LazyCodeEditor } from './LazyComponents';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { lastRunData, lastRunDataByNodeState } from '../state/dataFlow';
import { graphState } from '../state/graph';
import { BuiltInNodeType, type BuiltInNodes, type GraphInputNode, type PortId } from '@ironclad/rivet-core';
import { max, maxBy, range } from 'lodash-es';
import { Field, Label } from '@atlaskit/form';
import { css } from '@emotion/react';
import { trivetState } from '../state/trivet';
import { useTestSuite } from '../hooks/useTestSuite';
import Button from '@atlaskit/button';
import { overlayOpenState } from '../state/ui';

const body = css`
  min-height: 500px;

  display: flex;
  flex-direction: column;
  gap: 1rem;

  section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .preview,
  .editor-container {
    flex: 1;
  }

  .editor-container {
    min-height: 300px;
  }
`;

export const CopyAsTestCaseModal: FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const lastRunData = useRecoilValue(lastRunDataByNodeState);
  const graph = useRecoilValue(graphState);
  const [selectedExecutionNum, setSelectedExecutionNum] = useState(1);
  const [selectedTestSuiteId, setSelectedTestSuiteId] = useState<string | undefined>(undefined);
  const [{ testSuites }, setTrivetState] = useRecoilState(trivetState);
  const { addTestCase } = useTestSuite(selectedTestSuiteId);
  const setOverlay = useSetRecoilState(overlayOpenState);

  const inputNodes = graph.nodes.filter((n) => (n as BuiltInNodes).type === 'graphInput') as GraphInputNode[];
  const lastRunDataForInputNodes = inputNodes.map((n) => lastRunData[n.id]);

  const numExecutions =
    max(
      lastRunDataForInputNodes.map((data) => {
        if (data == null) {
          return 0;
        }

        return data.length;
      }),
    ) ?? 0;

  const executionNumOptions = range(0, numExecutions).map((_, i) => ({
    label: `${i + 1}`,
    value: i + 1,
  }));

  const asJson = inputNodes.reduce((acc, node) => {
    const data = lastRunData[node.id]?.[selectedExecutionNum - 1];
    if (data == null) {
      return acc;
    }

    return {
      ...acc,
      [node.data.id]: data.data.outputData?.['data' as PortId]?.value ?? null,
    };
  }, {});

  const testSuiteOptions = testSuites.map((ts) => ({
    label: ts.name,
    value: ts.id,
  }));

  const doTestCaseAdd = () => {
    if (selectedTestSuiteId == null) {
      return;
    }

    addTestCase(asJson);
    setOverlay('trivet');

    setTrivetState((state) => ({
      ...state,
      selectedTestSuiteId,
    }));
    onClose();
  };

  return (
    <ModalTransition>
      {open && (
        <Modal onClose={onClose} width="large">
          <ModalHeader>
            <ModalTitle>Copy as Test Case</ModalTitle>
          </ModalHeader>
          <ModalBody>
            {numExecutions === 0 ? (
              <p>Could not find any graph input nodes that have executed.</p>
            ) : (
              <div css={body}>
                {executionNumOptions.length > 1 && (
                  <section>
                    <Label htmlFor="">Graph Execution</Label>
                    <Select
                      options={executionNumOptions}
                      defaultValue={executionNumOptions.find((o) => o.value === selectedExecutionNum)}
                      onChange={(e) => setSelectedExecutionNum(e!.value)}
                    />
                  </section>
                )}
                <section>
                  <Label htmlFor="">Test Suite</Label>
                  <Select
                    options={testSuiteOptions}
                    value={testSuiteOptions.find((o) => o.value === selectedTestSuiteId)}
                    onChange={(e) => setSelectedTestSuiteId(e!.value)}
                  />
                </section>

                <section className="preview">
                  <Label htmlFor="">Preview</Label>
                  <LazyCodeEditor text={JSON.stringify(asJson, null, 2)} language="json" isReadonly />
                </section>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Close</Button>
            <Button appearance="primary" onClick={doTestCaseAdd}>
              Add Test Case
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </ModalTransition>
  );
};
