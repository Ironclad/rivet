import { FC } from 'react';
import { atom, useRecoilState } from 'recoil';
import { settingsState } from '../state/settings';
import Modal, { ModalTransition, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@atlaskit/modal-dialog';
import TextField from '@atlaskit/textfield';
import Button from '@atlaskit/button';
import { Field } from '@atlaskit/form';

interface SettingsModalProps {}

export const settingsModalOpenState = atom({
  key: 'settingsModalOpen',
  default: false,
});

export const SettingsModal: FC<SettingsModalProps> = () => {
  const [isOpen, setIsOpen] = useRecoilState(settingsModalOpenState);
  const [settings, setSettings] = useRecoilState(settingsState);

  const closeModal = () => setIsOpen(false);

  return (
    <ModalTransition>
      {isOpen && (
        <Modal onClose={closeModal} width="medium">
          <ModalHeader>
            <ModalTitle>Settings</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <Field name="api-key" label="OpenAI API Key">
              {() => (
                <TextField
                  value={settings.openAiKey}
                  onChange={(e) => setSettings((s) => ({ ...s, openAiKey: (e.target as HTMLInputElement).value }))}
                />
              )}
            </Field>
            <Field name="organization" label="OpenAI Organization (optional)">
              {() => (
                <TextField
                  value={settings.openAiOrganization}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, openAiOrganization: (e.target as HTMLInputElement).value }))
                  }
                />
              )}
            </Field>
          </ModalBody>
          <ModalFooter>
            <Button appearance="primary" onClick={closeModal}>
              Close
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </ModalTransition>
  );
};
