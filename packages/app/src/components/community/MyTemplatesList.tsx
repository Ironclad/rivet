import { css } from '@emotion/react';
import { type FC } from 'react';
import Button from '@atlaskit/button';
import { fetchCommunity, useCommunityApi } from '../../hooks/useCommunityApi';
import { useQuery } from '@tanstack/react-query';
import { array } from '@recoiljs/refine';
import { templateResponseChecker } from '../../utils/communityApi';

export const styles = css`
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;

  > header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .templates {
    margin-top: 16px;
    flex: 1;
    display: flex;
    flex-direction: column;
    background: var(--grey-dark);
    border: 1px solid var(--grey);
    flex: 1 1 auto;
    overflow: auto;
    min-height: 0;

    .template {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-bottom: 1px solid var(--grey);

      .info {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .stats {
        display: flex;
        gap: 16px;
      }

      .actions {
        display: flex;
        gap: 8px;
      }

      &:hover {
        background: var(--grey-darkish);
      }
    }
  }
`;

export const MyTemplatesList: FC<{
  onEditTemplate?: (template: any) => void;
  onCreateNew?: () => void;
}> = ({ onEditTemplate, onCreateNew }) => {
  const { data } = useQuery({
    queryKey: ['my-templates'],
    queryFn: () => fetchCommunity('/templates/mine', array(templateResponseChecker)),
  });

  return (
    <div css={styles}>
      <header>
        <h1>My Templates</h1>
        <div className="actions">
          <Button appearance="primary" onClick={onCreateNew}>
            Upload Current Project As New Template
          </Button>
        </div>
      </header>
      <div className="templates">
        {data?.map((template) => {
          const latestVersion = template.versions.at(-1);

          return (
            <div className="template" key={template.id}>
              <div className="info">
                <h3>{template.name}</h3>
                {latestVersion ? (
                  <div className="stats">
                    <span>Latest Version: {latestVersion.version}</span>
                    <span>Created: {new Date(latestVersion.createdAt).toLocaleDateString()}</span>
                    <span>Stars: {template.stars}</span>
                  </div>
                ) : (
                  <span>No versions</span>
                )}
              </div>
              <div className="actions">
                <Button appearance="primary" onClick={() => onEditTemplate?.(template)}>
                  Edit
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
