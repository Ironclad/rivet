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
  margin: 0 auto;

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
# No Test Suites Yet!

Trivet is an integrated test runner in Rivet - you create your tests inside rivet, define their inputs and expected outputs,
and run validation graphs to verify your graphs.

Tests are organized into suites - designed so that you can have a suite for each graph you are testing.

Begin by right clicking on the test suite list and selecting "New Test Suite" to create your first test,
or clicking the button below.

Get started now, or check out the documentation for detailed instructions!
`;

export const NoTestSuitesSplash: FC<{
  onCreateTestSuite?: () => void;
}> = ({ onCreateTestSuite }) => {
  const contentHtml = useMarkdown(content);

  const viewDocumentation = useOpenUrl('https://rivet.ironcladapp.com/docs/trivet');

  return (
    <div css={styles}>
      <div className="content">
        <div className="content-markdown" dangerouslySetInnerHTML={contentHtml} />
        <div className="buttons">
          <Button appearance="primary" onClick={onCreateTestSuite}>
            Create Test Suite
          </Button>
          <Button appearance="default" onClick={viewDocumentation}>
            View Trivet Documentation
          </Button>
        </div>
      </div>
    </div>
  );
};
