import { FC } from 'react';
import { atom, useRecoilState } from 'recoil';
import { settingsState, themeState, themes } from '../state/settings.js';
import Modal, { ModalTransition, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@atlaskit/modal-dialog';
import TextField from '@atlaskit/textfield';
import Button from '@atlaskit/button';
import { Field } from '@atlaskit/form';
import { useDependsOnPlugins } from '../hooks/useDependsOnPlugins';
import { entries } from '../../../core/src/utils/typeSafety';
import { match } from 'ts-pattern';
import Select from '@atlaskit/select';

interface SettingsModalProps {}

export const settingsModalOpenState = atom({
  key: 'settingsModalOpen',
  default: false,
});

export const SettingsModal: FC<SettingsModalProps> = () => {
  const [isOpen, setIsOpen] = useRecoilState(settingsModalOpenState);
  const [settings, setSettings] = useRecoilState(settingsState);
  const [theme, setTheme] = useRecoilState(themeState);

  const plugins = useDependsOnPlugins();

  const closeModal = () => setIsOpen(false);

  return (
    <ModalTransition>
      {isOpen && (
        <Modal onClose={closeModal} width="medium">
          <ModalHeader>
            <ModalTitle>Settings</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <Field name="theme" label="Theme">
              {() => (
                <Select
                  value={themes.find((o) => o.value === theme)}
                  onChange={(e) => e && setTheme(e.value as any)}
                  options={themes}
                />
              )}
            </Field>
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
            {plugins.map((plugin) => {
              const configOptions = entries(plugin.configSpec ?? {});
              return configOptions.map(([key, config]) => {
                return (
                  <Field name={`plugin-${plugin.id}-${key}`} label={`${config.label} (${plugin.id})`}>
                    {() =>
                      match(config)
                        .with({ type: 'string' }, () => (
                          <TextField
                            value={(settings.pluginSettings?.[plugin.id]?.[key] as string | undefined) ?? ''}
                            onChange={(e) =>
                              setSettings((s) => ({
                                ...s,
                                pluginSettings: {
                                  ...s.pluginSettings,
                                  [plugin.id]: {
                                    ...s.pluginSettings?.[plugin.id],
                                    [key]: (e.target as HTMLInputElement).value,
                                  },
                                },
                              }))
                            }
                          />
                        ))
                        .otherwise(() => null)
                    }
                  </Field>
                );
              });
            })}
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
