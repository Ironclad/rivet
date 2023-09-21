import { FC, useState } from 'react';
import { atom, useRecoilState } from 'recoil';
import {
  defaultExecutorState,
  executorOptions,
  recordExecutionsState,
  settingsState,
  themeState,
  themes,
} from '../state/settings.js';
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
import { KeyValuePairs } from './editors/KeyValuePairEditor';

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
    padding: 0 30px 100px 30px;
  }
`;

type Pages = 'general' | 'openai' | 'plugins';

const buttonsContainer = css`
  > button span {
    // Fix invisible text on Ubuntu/Kubuntu
    overflow-x: visible !important;
  }
`;

export const SettingsModal: FC<SettingsModalProps> = () => {
  const [isOpen, setIsOpen] = useRecoilState(settingsModalOpenState);
  const [page, setPage] = useState<Pages>('general');

  const closeModal = () => setIsOpen(false);

  return (
    <ModalTransition>
      {isOpen && (
        <Modal onClose={closeModal} width="xlarge">
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
                    <div css={buttonsContainer}>
                      <ButtonItem isSelected={page === 'general'} onClick={() => setPage('general')}>
                        General
                      </ButtonItem>
                      <ButtonItem isSelected={page === 'openai'} onClick={() => setPage('openai')}>
                        OpenAI
                      </ButtonItem>
                      <ButtonItem isSelected={page === 'plugins'} onClick={() => setPage('plugins')}>
                        Plugins
                      </ButtonItem>
                    </div>
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
  const [defaultExecutor, setDefaultExecutor] = useRecoilState(defaultExecutorState);

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
      <Field name="defaultExecutor">
        {() => (
          <>
            <Label htmlFor="defaultExecutor" testId="defaultExecutor">
              Default executor
            </Label>
            <div className="toggle-field">
              <Select
                value={executorOptions.find((o) => o.value === defaultExecutor)}
                onChange={(e) => setDefaultExecutor(e!.value)}
                options={executorOptions}
              />
            </div>
            <HelperMessage>
              The default executor to use when starting the application. The browser executor is more stable, but the
              node executor is required for some features and plugins.
            </HelperMessage>
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

  const chatNodeHeadersPairs = entries(settings.chatNodeHeaders ?? {}).map(([key, value]) => ({
    key,
    value,
  }));

  const [headers, setHeaders] = useState<{ key: string; value: string }[]>(chatNodeHeadersPairs);

  const onSetHeaders = (newHeaders: { key: string; value: string }[]) => {
    setHeaders(newHeaders);
    setSettings((s) => ({
      ...s,
      chatNodeHeaders: Object.fromEntries(newHeaders.map(({ key, value }) => [key, value])),
    }));
  };

  const configureAzure = () => {
    setSettings((s) => ({
      ...s,
      openAiEndpoint:
        'https://{your-resource-name}.openai.azure.com/openai/deployments/{deployment-id}/chat/completions?api-version=2023-05-15',
      chatNodeHeaders: {
        'api-key': '',
      },
    }));

    setHeaders([
      {
        key: 'api-key',
        value: '',
      },
    ]);
  };

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
      <Field name="organization" label="OpenAI Organization">
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
      {!settings.openAiEndpoint && (
        <div className="configure-azure">
          <Button appearance="primary" onClick={configureAzure}>
            Configure For Azure OpenAI
          </Button>
          <HelperMessage>
            You can click this button to set up a configuration for Azure OpenAI. You will have to fill in placeholder
            fields in the OpenAI Endpoint, and fill in your API key header.
          </HelperMessage>
        </div>
      )}

      <Field name="organization" label="OpenAI Endpoint">
        {() => (
          <>
            <TextField
              value={settings.openAiEndpoint}
              onChange={(e) => setSettings((s) => ({ ...s, openAiEndpoint: (e.target as HTMLInputElement).value }))}
            />
            <HelperMessage>
              Default endpoint to use for Chat nodes. Set to any OpenAI-compatible API endpoint. Leave blank to use
              OpenAI itself. You may also set the OPENAI_API_ENDPOINT environment variable.
            </HelperMessage>
          </>
        )}
      </Field>
      <KeyValuePairs
        label="Chat Node Headers"
        helperMessage="Headers to send with each request of a Chat node to its endpoint. You can use this for alternative APIs such as Azure OpenAI."
        name="chatNodeHeaders"
        keyValuePairs={headers}
        isValuesSecret
        onAddPair={() => onSetHeaders([...headers, { key: '', value: '' }])}
        onDeletePair={(index) => onSetHeaders(headers.filter((_, i) => i !== index))}
        onPairChange={(index, keyOrValue, value) => {
          const newHeaders = [...headers];
          newHeaders[index]![keyOrValue] = value;
          onSetHeaders(newHeaders);
        }}
      />
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
