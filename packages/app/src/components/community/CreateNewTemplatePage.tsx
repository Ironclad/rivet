import { css } from '@emotion/react';
import { useState, type FC, useMemo, Suspense } from 'react';
import Button from '@atlaskit/button';
import CrossIcon from 'majesticons/line/multiply-line.svg?react';
import { useRecoilValue } from 'recoil';
import { projectState } from '../../state/savedGraphs';
import { Field } from '@atlaskit/form';
import TextField from '@atlaskit/textfield';
import { LazyCodeEditor } from '../LazyComponents';
import Toggle from '@atlaskit/toggle';
import clsx from 'clsx';
import { type GraphId } from '@ironclad/rivet-core';
import { orderBy } from 'lodash-es';
import { CreateTemplateForm } from './CreateTemplateForm';
import { useUploadNewTemplate } from '../../hooks/useUploadNewTemplate';

const styles = css`
  display: flex;
  flex-direction: column;
  overflow: hidden;

  > header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    button {
      padding: 0;
      span {
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }

  .form {
    overflow: auto;
    min-height: 0;
    flex: 0 1 auto;
  }
`;

export const CreateNewTemplatePage: FC<{
  onClose?: () => void;
}> = ({ onClose }) => {
  const uploadNewTemplate = useUploadNewTemplate({
    onCompleted: () => {
      onClose?.();
    },
  });

  return (
    <div css={styles}>
      <header>
        <h1>Create new template from current project</h1>
        <div className="close">
          <Button appearance="subtle" onClick={onClose}>
            <CrossIcon />
          </Button>
        </div>
      </header>
      <div className="form">
        <CreateTemplateForm onCreate={(info) => uploadNewTemplate.mutate(info)} />
      </div>
    </div>
  );
};
