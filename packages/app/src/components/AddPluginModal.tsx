import { HelperMessage } from '@atlaskit/form';
import { FC, useEffect, useState } from 'react';
import TextField from '@atlaskit/textfield';
import Modal, { ModalTransition, ModalTitle, ModalHeader, ModalFooter, ModalBody } from '@atlaskit/modal-dialog';
import Button from '@atlaskit/button';
import { useToggle } from 'ahooks';
import Select from '@atlaskit/select';
import { Field } from '@atlaskit/form';
import { useBuiltInPlugins } from '../hooks/useBuiltInPlugins';
import { toast } from 'react-toastify';
import { RivetPluginInitializer } from '@ironclad/rivet-core';
import * as Rivet from '@ironclad/rivet-core';
import { useOpenUrl } from '../hooks/useOpenUrl';
import { PluginLoadSpec } from '../../../core/src/model/PluginLoadSpec';
import { css } from '@emotion/react';
import { appLocalDataDir, join } from '@tauri-apps/api/path';
import { ReactComponent as CopyIcon } from 'majesticons/line/clipboard-line.svg';
import { copyToClipboard } from '../utils/copyToClipboard';

const addPluginBody = css`
  display: flex;
  flex-direction: column;
  gap: 16px;

  .add-remote-plugin {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .buttons {
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }
  }

  .built-in-plugins {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .buttons {
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }
  }

  .add-npm-plugin {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .inputs {
      display: grid;
      grid-template-columns: 3fr 1fr;
      column-gap: 8px;
    }

    .buttons {
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }

    .helperMessage > div > span {
      display: inline-flex;
      align-items: center;
      gap: 8px;

      code {
        line-height: 11px;
        font-size: 11px;
      }

      .copy-plugin-dir-button {
        cursor: pointer;

        &:hover {
          color: white;
        }
      }
    }
  }
`;

export const AddPluginModal: FC<{
  isOpen: boolean;
  onClose: () => void;
  onAddPlugin: (plugin: PluginLoadSpec) => void;
}> = ({ isOpen, onClose, onAddPlugin }) => {
  const [pluginUri, setPluginUri] = useState('');
  const [selectedBuiltInPlugin, setSelectedBuiltInPlugin] = useState<string | undefined>();
  const builtInPlugins = useBuiltInPlugins();
  const [loadingPlugin, toggleLoadingPlugin] = useToggle();
  const [pluginPackageName, setPluginPackageName] = useState('');
  const [pluginTag, setPluginTag] = useState('');

  const addBuiltInPlugin = () => {
    if (!selectedBuiltInPlugin) {
      return;
    }

    onAddPlugin({
      id: selectedBuiltInPlugin,
      type: 'built-in',
      name: selectedBuiltInPlugin,
    });

    setSelectedBuiltInPlugin(undefined);
  };

  const addRemotePlugin = async () => {
    try {
      if (pluginUri.trim() === '') {
        return;
      }

      toggleLoadingPlugin.setRight();

      const plugin = await import(pluginUri);

      if (!plugin) {
        throw new Error(`Failed to load plugin from ${pluginUri}`);
      }

      if (!plugin.default) {
        throw new Error(`Plugin at ${pluginUri} does not have a default export`);
      }

      if (typeof plugin.default !== 'function') {
        throw new Error(`Plugin at ${pluginUri} does not export a function`);
      }

      const initializer = plugin.default as RivetPluginInitializer;

      const pluginInstance = initializer(Rivet);

      if (!pluginInstance || !pluginInstance.id) {
        throw new Error(`Plugin at ${pluginUri} did not return a valid plugin`);
      }

      onAddPlugin({
        type: 'uri',
        id: pluginInstance.id,
        uri: pluginUri,
      });

      setPluginUri('');
    } catch (err) {
      toast.error(`Failed to load plugin: ${err}`);
    } finally {
      toggleLoadingPlugin.setLeft();
    }
  };

  const addPackagePlugin = () => {
    if (!pluginPackageName.trim()) {
      return;
    }

    const tag = pluginTag.trim() || 'latest';

    onAddPlugin({
      type: 'package',
      id: `${pluginPackageName}@${tag}`,
      package: pluginPackageName,
      tag,
    });
  };

  const goToDocs = useOpenUrl('https://rivet.ironcladapp.com/docs/'); // TODO

  const [pluginStoreDirectory, setPluginStoreDirectory] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const appDataDir = await appLocalDataDir();
        setPluginStoreDirectory(await join(appDataDir, 'plugins'));
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const copyPluginStoreDirectory = async () => {
    copyToClipboard(pluginStoreDirectory);
    toast.success('Copied plugin store directory to clipboard');
  };

  return (
    <ModalTransition>
      {isOpen && (
        <Modal width="x-large" onClose={onClose} height="100%">
          <ModalHeader>
            <ModalTitle>Add Plugin</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <div css={addPluginBody}>
              <Field name="plugin" label="Add Remote Plugin">
                {() => (
                  <div className="add-remote-plugin">
                    <TextField
                      label="Plugin URL"
                      value={pluginUri}
                      placeholder="https://example.com/plugin.js"
                      onChange={(e) => setPluginUri((e.target as HTMLInputElement).value)}
                    />
                    <HelperMessage>
                      Plugins must be hosted on a public URL and must export a function that returns a valid Rivet
                      plugin. See the <a onClick={goToDocs}>documentation</a> for more information.
                    </HelperMessage>
                    <div className="buttons">
                      <Button
                        appearance="primary"
                        onClick={addRemotePlugin}
                        isDisabled={loadingPlugin || !pluginUri.trim()}
                      >
                        {loadingPlugin ? 'Loading...' : 'Add Remote Plugin'}
                      </Button>
                    </div>
                  </div>
                )}
              </Field>
              <Field name="plugin" label="Add NPM Plugin">
                {() => (
                  <div className="add-npm-plugin">
                    <div className="inputs">
                      <TextField
                        label="Package Name"
                        value={pluginPackageName}
                        placeholder="Package Name"
                        onChange={(e) => setPluginPackageName((e.target as HTMLInputElement).value)}
                      />
                      <TextField
                        label="Tag"
                        value={pluginTag}
                        placeholder="Tag (latest)"
                        onChange={(e) => setPluginTag((e.target as HTMLInputElement).value)}
                      />
                    </div>
                    <div className="helperMessage">
                      <HelperMessage>
                        Plugins are stored in: <code>{pluginStoreDirectory}</code>{' '}
                        <CopyIcon className="copy-plugin-dir-button" onClick={copyPluginStoreDirectory} />
                      </HelperMessage>
                    </div>
                    <div className="buttons">
                      <Button
                        appearance="primary"
                        onClick={addPackagePlugin}
                        isDisabled={loadingPlugin || !pluginPackageName.trim()}
                      >
                        {loadingPlugin ? 'Loading...' : 'Add NPM Plugin'}
                      </Button>
                    </div>
                  </div>
                )}
              </Field>
              <Field name="plugin" label="Built-In Plugins">
                {() => (
                  <div className="built-in-plugins">
                    <Select
                      options={builtInPlugins}
                      placeholder="Select a plugin"
                      onChange={(e) => setSelectedBuiltInPlugin(e?.value)}
                      value={builtInPlugins.find((id) => id.value === selectedBuiltInPlugin)}
                    />
                    <div className="buttons">
                      <Button appearance="primary" onClick={addBuiltInPlugin} isDisabled={!selectedBuiltInPlugin}>
                        Add Built-In Plugin
                      </Button>
                    </div>
                  </div>
                )}
              </Field>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button appearance="subtle" onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </ModalTransition>
  );
};
