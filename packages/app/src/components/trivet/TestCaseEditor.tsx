import { FC, useEffect, useMemo, useState } from "react";
import { trivetState } from "../../state/trivet";
import { useRecoilState } from "recoil";
import Button from "@atlaskit/button";
import { css } from "@emotion/react";
import { CodeEditor } from "../CodeEditor";
import { isEqual } from "lodash-es";

const styles = css`
  .close-button {
    position: absolute;
    top: 0;
    right: 0;
    cursor: pointer;
  }
  .editor-container {
    min-height: 200px;
  }
`;

export const TestCaseEditor: FC = () => {
  const [{ testSuites, selectedTestSuiteId, editingTestCaseId }, setState] = useRecoilState(trivetState);
  const selectedTestSuite = useMemo(() => testSuites.find((ts) => ts.id === selectedTestSuiteId), [testSuites, selectedTestSuiteId]);
  const selectedTestCase = useMemo(() => selectedTestSuite?.testCases.find((tc) => tc.id === editingTestCaseId), [selectedTestSuite, editingTestCaseId]);

  function onClose() {
    setState((s) => ({ ...s, editingTestCaseId: undefined }));
  };

  if (selectedTestCase == null) {
    return <div />;
  }

  return (
    <div css={styles}>
      <Button className="close-trivet" appearance="subtle" onClick={onClose}>
        &times;
      </Button>

      <div>
        <label>Inputs</label>
        <InputOutputEditor
          json={selectedTestCase?.inputs ?? {}}
          setJson={(inputs) => setState((s) => ({ ...s, testSuites: s.testSuites.map((ts) => ts.id === selectedTestSuiteId ? { ...ts, testCases: ts.testCases.map((tc) => tc.id === editingTestCaseId ? { ...tc, inputs } : tc) } : ts) }))}
        />
      </div>
      <div>
        <label>Baseline Outputs</label>
        <InputOutputEditor
          json={selectedTestCase?.baselineOutputs ?? {}}
          setJson={(baselineOutputs) => setState((s) => ({ ...s, testSuites: s.testSuites.map((ts) => ts.id === selectedTestSuiteId ? { ...ts, testCases: ts.testCases.map((tc) => tc.id === editingTestCaseId ? { ...tc, baselineOutputs } : tc) } : ts) }))}
        />
      </div>
    </div>
  );
};

const InputOutputEditor: FC<{ json: Record<string, unknown>, setJson: (json: Record<string, unknown>) => void }> = ({ json, setJson }) => {
  const [text, setText] = useState(JSON.stringify(json, null, 2));

  const handleChange = (newText: string) => {
    setText(newText);
    try {
      const updatedJson = JSON.parse(newText);
      setJson(updatedJson);
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
      <CodeEditor
        text={text}
        onChange={handleChange}
        language="json"
      />
    </div>
  );
};