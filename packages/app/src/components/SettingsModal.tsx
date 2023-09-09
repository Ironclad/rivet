import { FC, useState } from 'react';
import { atom, useRecoilState } from 'recoil';
import { recordExecutionsState, settingsState, themeState, themes } from '../state/settings.js';
import Modal, { ModalTransition, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@atlaskit/modal-dialog';
import TextField from '@atlaskit/textfield';
import Button from '@atlaskit/button';
import { Field, HelperMessage } from '@atlaskit/form';
import { useDependsOnPlugins } from '../hooks/useDependsOnPlugins';
import { entries } from '../../../core/src/utils/typeSafety';
import { match } from 'ts-pattern';
import Select from '@atlaskit/select';
import { SecretPluginConfigurationSpec, StringPluginConfigurationSpec } from '../../../core/src/index.js';
import { SideNavigation, NavigationHeader, ButtonItem, Header, NavigationContent } from '@atlaskit/side-navigation';
import CrossIcon from '@atlaskit/icon/glyph/cross';
import { css } from '@emotion/react';
import Toggle from '@atlaskit/toggle';
import { Label } from '@atlaskit/form';

interface SettingsModalProps {}

export const settingsModalOpenState = atom({
  key: 'settingsModalOpen',
  default: false,
});

const modalBody = css`
  min-height: 300px;
  display: grid;
  grid-template-columns: 240px 1fr;

  nav {
    padding-bottom: 20px;
  }

  main {
    padding: 0 30px 30px 30px;
  }
`;

type Pages = 'general' | 'openai' | 'plugins';

export const SettingsModal: FC<SettingsModalProps> = () => {
  const [isOpen, setIsOpen] = useRecoilState(settingsModalOpenState);
  const [page, setPage] = useState<Pages>('general');

  const closeModal = () => setIsOpen(false);

  return (
    <ModalTransition>
      {isOpen && (
        <Modal onClose={closeModal} width="large">
          <ModalHeader>
            <ModalTitle>Settings</ModalTitle>
            <Button appearance="link" onClick={() => setIsOpen(false)}>
              <CrossIcon label="Close Modal" primaryColor="currentColor" />
            </Button>
          </ModalHeader>
          <ModalBody>
            <div css={modalBody}>
              <nav>
                <SideNavigation label="settings">
                  <NavigationContent>
                    <ButtonItem isSelected={page === 'general'} onClick={() => setPage('general')}>
                      General
                    </ButtonItem>
                    <ButtonItem isSelected={page === 'openai'} onClick={() => setPage('openai')}>
                      OpenAI
                    </ButtonItem>
                    <ButtonItem isSelected={page === 'plugins'} onClick={() => setPage('plugins')}>
                      Plugins
                    </ButtonItem>
                  </NavigationContent>
                </SideNavigation>
              </nav>
              <main>
                {match(page)
                  .with('general', () => <GeneralSettingsPage />)
                  .with('openai', () => <OpenAiSettingsPage />)
                  .with('plugins', () => <PluginsSettingsPage />)
                  .exhaustive()}
              </main>
            </div>
          </ModalBody>
        </Modal>
      )}
    </ModalTransition>
  );
};

export const GeneralSettingsPage: FC = () => {
  const [settings, setSettings] = useRecoilState(settingsState);
  const [theme, setTheme] = useRecoilState(themeState);
  const [recordExecutions, setRecordExecutions] = useRecoilState(recordExecutionsState);

  return (
    <div css={fields}>
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
          <>
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
            <HelperMessage>
              This is the delay between each chat message when playing back a recording. Lower values will play
              recordings back faster.
            </HelperMessage>
          </>
        )}
      </Field>
      <Field name="recordExecutions">
        {() => (
          <>
            <Label htmlFor="recordExecutions" testId="recordExecutions">
              Record local graph executions
            </Label>
            <div className="toggle-field">
              <Toggle
                id="recordExecutions"
                isChecked={recordExecutions}
                onChange={(e) => setRecordExecutions(e.target.checked)}
              />
            </div>
            <HelperMessage>Disabling may help performance when dealing with very large data values</HelperMessage>
          </>
        )}
      </Field>
    </div>
  );
};

const fields = css`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const OpenAiSettingsPage: FC = () => {
  const [settings, setSettings] = useRecoilState(settingsState);

  return (
    <div css={fields}>
      <Field name="api-key" label="OpenAI API Key">
        {() => (
          <>
            <TextField
              type="password"
              value={settings.openAiKey}
              onChange={(e) => setSettings((s) => ({ ...s, openAiKey: (e.target as HTMLInputElement).value }))}
            />
            <HelperMessage>You may also set the OPENAI_API_KEY environment variable</HelperMessage>
          </>
        )}
      </Field>
      <Field name="organization" label="OpenAI Organization (optional)">
        {() => (
          <>
            <TextField
              value={settings.openAiOrganization}
              onChange={(e) => setSettings((s) => ({ ...s, openAiOrganization: (e.target as HTMLInputElement).value }))}
            />
            <HelperMessage>
              You may also set the OPENAI_ORG_ID environment variable. This is only required if you are a member of a
              shared organization.
            </HelperMessage>
          </>
        )}
      </Field>
    </div>
  );
};

export const PluginsSettingsPage: FC = () => {
  const plugins = useDependsOnPlugins();
  const [settings, setSettings] = useRecoilState(settingsState);

  if (plugins.length === 0) {
    return (
      <div>
        No plugins are enabled in this workspace. Enable plugins in the project settings panel and their settings will
        appear here.
      </div>
    );
  }

  return (
    <div css={fields}>
      {plugins.map((plugin) => {
        const configOptions = entries(plugin.configSpec ?? {});

        return (
          <section>
            <Header>{plugin.name ?? plugin.id}</Header>
            {configOptions.map(([key, config]) => (
              <Field name={`plugin-${plugin.id}-${key}`} label={`${config.label} (${plugin.id})`}>
                {() =>
                  match(config)
                    .with(
                      { type: 'string' },
                      { type: 'secret' },
                      (config: StringPluginConfigurationSpec | SecretPluginConfigurationSpec) => (
                        <>
                          <TextField
                            value={(settings.pluginSettings?.[plugin.id]?.[key] as string | undefined) ?? ''}
                            type={config.type === 'secret' ? 'password' : 'text'}
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
                          {config.helperText && <HelperMessage>{config.helperText}</HelperMessage>}
                        </>
                      ),
                    )
                    .otherwise(() => null)
                }
              </Field>
            ))}
          </section>
        );
      })}
    </div>
  );
};
