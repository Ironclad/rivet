import { css } from '@emotion/react';
import { type FC } from 'react';
import { useMarkdown } from '../../hooks/useMarkdown';
import Button from '@atlaskit/button';
import { useOpenUrl } from '../../hooks/useOpenUrl';

const styles = css`
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: center;
  max-width: 800px;
  align-items: center;
  margin: 64px auto 0 auto;

  .content {
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
    padding: 32px;
    background: var(--grey-dark);
    font-size: 16px;
    line-height: 24px;

    p {
      margin: 16px 0;
    }
  }

  h1 {
    color: var(--primary-text);
  }

  .buttons {
    display: flex;
    justify-content: center;
    margin-top: 32px;
    gap: 16px;
  }
`;

const content = `
# No Test Cases Yet!

To get started, you'll need to set a Test Graph (the graph you want to test, or a graph crafted to test your target graph), and a Validation Graph.

The *Test Graph* is the graph that runs to generate a set of outputs you are validating. It can have any Graph Output nodes you'd like. The Graph Input nodes
to the Test Graph will be populated with each test case's inputs.

The *Validation Graph* is the graph that will take in the \`inputs\`, \`outputs\`, and the test case's \`expectedOutputs\`, and should use these inputs
in any way you wish to validate that the test case passes. The validation graph should return any number of boolean (or truthy) output nodes. Each output
will be checked for each test case.

Once done, you can click the button below to add a test case. Input your graph's inputs and expected outputs.
`;

export const NoTestCasesSplash: FC<{
  onCreateNewTestCase?: () => void;
}> = ({ onCreateNewTestCase }) => {
  const contentHtml = useMarkdown(content);

  const viewDocumentation = useOpenUrl('https://rivet.ironcladapp.com/docs/trivet');

  return (
    <div css={styles}>
      <div className="content">
        <div className="content-markdown" dangerouslySetInnerHTML={contentHtml} />
        <div className="buttons">
          <Button appearance="primary" onClick={() => onCreateNewTestCase?.()}>
            Create Test Case
          </Button>
          <Button appearance="default" onClick={viewDocumentation}>
            View Trivet Documentation
          </Button>
        </div>
      </div>
    </div>
  );
};
