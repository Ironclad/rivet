import { FC, Suspense, useEffect, useMemo, useState } from 'react';
import { trivetState } from '../../state/trivet';
import { useRecoilState } from 'recoil';
import Button from '@atlaskit/button';
import { css } from '@emotion/react';
import { isEqual } from 'lodash-es';
import { LazyCodeEditor } from '../LazyComponents';

const styles = css`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: auto;

  .group {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
  }

  .close-button {
    position: absolute;
    top: 0;
    right: 0;
    cursor: pointer;
  }

  .editor,
  .editor-container {
    height: 100%;
  }

  .editor {
    position: relative;
  }

  .editor-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }

  .testCaseError pre {
    white-space: pre-wrap;
  }

  > div {
    margin-bottom: 10px;
  }

  .group label {
    display: block;
    padding-bottom: 4px;
  }
`;

export const TestCaseEditor: FC = () => {
  const [{ testSuites, selectedTestSuiteId, editingTestCaseId, recentTestResults }, setState] =
    useRecoilState(trivetState);
  const selectedTestSuite = useMemo(
    () => testSuites.find((ts) => ts.id === selectedTestSuiteId),
    [testSuites, selectedTestSuiteId],
  );
  const selectedTestCase = useMemo(
    () => selectedTestSuite?.testCases.find((tc) => tc.id === editingTestCaseId),
    [selectedTestSuite, editingTestCaseId],
  );
  const testCaseResults = useMemo(
    () =>
      recentTestResults?.testSuiteResults
        .find((tsr) => tsr.id === selectedTestSuiteId)
        ?.testCaseResults.find((tcr) => tcr.id === editingTestCaseId),
    [recentTestResults, selectedTestSuiteId, editingTestCaseId],
  );

  function onClose() {
    setState((s) => ({ ...s, editingTestCaseId: undefined }));
  }

  if (selectedTestCase == null) {
    return <div />;
  }

  return (
    <div css={styles}>
      <Button className="close-trivet" appearance="subtle" onClick={onClose}>
        &times;
      </Button>

      <div className="group">
        <label>Input</label>
        <InputOutputEditor
          json={selectedTestCase?.input ?? {}}
          setJson={(input) =>
            setState((s) => ({
              ...s,
              testSuites: s.testSuites.map((ts) =>
                ts.id === selectedTestSuiteId
                  ? {
                      ...ts,
                      testCases: ts.testCases.map((tc) => (tc.id === editingTestCaseId ? { ...tc, input } : tc)),
                    }
                  : ts,
              ),
            }))
          }
        />
      </div>
      <div className="group">
        <label>Expected Output</label>
        <InputOutputEditor
          json={selectedTestCase?.expectedOutput ?? {}}
          setJson={(expectedOutput) =>
            setState((s) => ({
              ...s,
              testSuites: s.testSuites.map((ts) =>
                ts.id === selectedTestSuiteId
                  ? {
                      ...ts,
                      testCases: ts.testCases.map((tc) =>
                        tc.id === editingTestCaseId ? { ...tc, expectedOutput } : tc,
                      ),
                    }
                  : ts,
              ),
            }))
          }
        />
      </div>
      {testCaseResults != null && (
        <div className="group">
          <label>
            {testCaseResults.passing ? '✅ ' : '❌ '}
            Test Result Outputs
          </label>
          <InputOutputEditor json={testCaseResults.outputs ?? {}} />
        </div>
      )}
      {testCaseResults?.error != null && (
        <div className="testCaseError">
          <label>Error</label>
          <pre>
            {testCaseResults.error.message ?? testCaseResults.error}
            {testCaseResults.error.stack ?? ''}
          </pre>
        </div>
      )}
    </div>
  );
};

const InputOutputEditor: FC<{
  json: Record<string, unknown>;
  setJson?: (json: Record<string, unknown>) => void;
}> = ({ json, setJson }) => {
  const [text, setText] = useState(JSON.stringify(json, null, 2));

  const handleChange = (newText: string) => {
    setText(newText);
    try {
      const updatedJson = JSON.parse(newText);
      setJson?.(updatedJson);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    let obj: Record<string, unknown> | undefined;
    try {
      obj = JSON.parse(text);
    } catch (err) {
      obj = undefined;
    }
    if (!isEqual(obj, json)) {
      setText(JSON.stringify(json, null, 2));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [json]);

  return (
    <div className="editor">
      <Suspense fallback={<div />}>
        <LazyCodeEditor
          isReadonly={setJson == null}
          text={text}
          onChange={handleChange}
          language="json"
          scrollBeyondLastLine={false}
        />
      </Suspense>
    </div>
  );
};
