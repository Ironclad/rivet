import Button from '@atlaskit/button';
import TextField from '@atlaskit/textfield';
import { css } from '@emotion/react';
import { ChangeEvent, FC, useState } from 'react';
import { Field } from '@atlaskit/form';

const styles = css`
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: absolute;
  top: calc(100% + 8px);
  background: var(--grey-darker);
  padding: 16px;
  box-shadow: 0 8px 16px var(--shadow-dark);
  width: 400px;

  .inputs {
  }

  .buttons {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    align-items: center;

    .connect {
      background-color: var(--primary);
      color: var(--grey-dark) !important;
    }
  }
`;

export type DebuggerConnectPanelProps = {
  onConnect?: (url: string) => void;
  onCancel?: () => void;
};

export const DebuggerConnectPanel: FC<DebuggerConnectPanelProps> = ({ onConnect, onCancel }) => {
  const [connectUrl, setConnectUrl] = useState('');

  return (
    <div css={styles}>
      <div className="inputs">
        <Field label="Connection URL (leave blank for default localhost)" name="url">
          {() => (
            <TextField
              autoFocus
              value={connectUrl}
              placeholder="(Default)"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setConnectUrl(e.target.value)}
            />
          )}
        </Field>
      </div>

      <div className="buttons">
        <Button className="cancel" onClick={() => onCancel?.()}>
          Cancel
        </Button>
        <Button className="connect" onClick={() => onConnect?.(connectUrl)}>
          Connect
        </Button>
      </div>
    </div>
  );
};
