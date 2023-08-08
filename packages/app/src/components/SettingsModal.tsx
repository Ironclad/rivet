import { FC } from 'react';
import { atom, useRecoilState } from 'recoil';
import { settingsState } from '../state/settings.js';
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
            <Field name="recording-speed" label="Recording delay between chats (ms)">
              {() => (
                <TextField
                  type="number"
                  value={settings.recordingPlaybackLatency}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      recordingPlaybackLatency: (e.target as HTMLInputElement).valueAsNumber,
                    }))
                  }
                />
              )}
            </Field>
            <Field name="api-key" label="OpenAI API Key">
              {() => (
                <TextField
                  type="password"
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
            <Field name="pineconeApiKey" label="Pinecone API Key">
              {() => (
                <TextField
                  type="password"
                  value={settings.pineconeApiKey}
                  onChange={(e) => setSettings((s) => ({ ...s, pineconeApiKey: (e.target as HTMLInputElement).value }))}
                />
              )}
            </Field>
            <Field name="anthropicApiKey" label="Anthropic API Key">
              {() => (
                <TextField
                  type="password"
                  value={settings.anthropicApiKey}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, anthropicApiKey: (e.target as HTMLInputElement).value }))
                  }
                />
              )}
            </Field>
            <Field name="braintrustApiKey" label="BrainTrust API Key">
              {() => (
                <TextField
                  type="password"
                  value={settings.braintrustApiKey}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, braintrustApiKey: (e.target as HTMLInputElement).value }))
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
