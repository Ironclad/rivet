import { FC } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '@atlaskit/modal-dialog';
import { atom, useRecoilState } from 'recoil';
import { css } from '@emotion/react';
import { settingsState } from '../state/settings';

const styles = {
  main: css`
    z-index: 9999;
  `,
  closeButton: css``,
};

const container = css`
  font-family: 'Roboto', sans-serif;
  color: var(--foreground);

  display: grid;
  grid-template-columns: auto 1fr;
  row-gap: 16px;
  column-gap: 32px;
  align-items: center;
  grid-auto-rows: 40px;

  .row {
    display: contents;
  }

  .label {
    font-weight: 500;
    color: var(--foreground);
  }

  .select,
  .number-input {
    padding: 6px 12px;
    background-color: var(--grey-darkish);
    border: 1px solid var(--grey);
    border-radius: 4px;
    color: var(--foreground);
    outline: none;
    transition: border-color 0.3s;

    &:hover {
      border-color: var(--primary);
    }

    &:disabled {
      background-color: var(--grey-dark);
      border-color: var(--grey);
      color: var(--foreground-dark);
    }
  }

  .text-input {
    padding: 6px 12px;
    background-color: var(--grey-darkish);
    border: 1px solid var(--grey);
    border-radius: 4px;
    color: var(--foreground);
    outline: none;
    transition: border-color 0.3s;
    width: 100%;

    &:focus {
      border-color: var(--primary);
    }
  }

  .select {
    justify-self: start;
    width: 150px;
  }

  .number-input {
    justify-self: start;
    min-width: 0;
    width: 100px;
  }

  .checkbox-input {
    margin-left: 8px;
    cursor: pointer;

    &:hover {
      opacity: 0.8;
    }
  }
`;

interface SettingsModalProps {}

export const settingsModalOpenState = atom({
  key: 'settingsModalOpen',
  default: false,
});

export const SettingsModal: FC<SettingsModalProps> = () => {
  const [isOpen, setIsOpen] = useRecoilState(settingsModalOpenState);
  const [settings, setSettings] = useRecoilState(settingsState);

  return (
    <div css={styles.main}>
      {/* <ModalTransition> */}
      {isOpen && (
        <Modal onClose={() => setIsOpen(false)}>
          <ModalHeader>
            <ModalTitle>Settings</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <div css={container}>
              <div className="row">
                <div className="label">OpenAI API Key</div>
                <input
                  className="text-input"
                  type="text"
                  value={settings.openAiKey}
                  onChange={(e) => setSettings((s) => ({ ...s, openAiKey: e.target.value }))}
                />
              </div>
              <div className="row">
                <div className="label">OpenAI Organization (optional)</div>
                <input
                  className="text-input"
                  type="text"
                  value={settings.openAiOrganization}
                  onChange={(e) => setSettings((s) => ({ ...s, openAiOrganization: e.target.value }))}
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <button css={styles.closeButton} onClick={() => setIsOpen(false)}>
              Close
            </button>
          </ModalFooter>
        </Modal>
      )}
      {/* </ModalTransition> */}
    </div>
  );
};
