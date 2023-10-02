import { HelperMessage, Field } from '@atlaskit/form';
import { type FC, useState, useRef, useLayoutEffect } from 'react';
import TextField from '@atlaskit/textfield';
import Modal, { ModalTransition, ModalTitle, ModalHeader, ModalFooter, ModalBody } from '@atlaskit/modal-dialog';
import Button from '@atlaskit/button';
import { useToggle } from 'ahooks';
import { toast } from 'react-toastify';
import { getError } from '@ironclad/rivet-core';
import { useOpenUrl } from '../hooks/useOpenUrl';
import { type PackagePluginLoadSpec, type PluginLoadSpec } from '../../../core/src/model/PluginLoadSpec';
import { css } from '@emotion/react';
import { appLocalDataDir, join } from '@tauri-apps/api/path';
import { ReactComponent as CopyIcon } from 'majesticons/line/clipboard-line.svg';
import { copyToClipboard } from '../utils/copyToClipboard';
import { useLoadPackagePlugin } from '../hooks/useLoadPackagePlugin';
import { useRecoilValue } from 'recoil';
import { pluginsState } from '../state/plugins';
import useAsyncEffect from 'use-async-effect';
import { type BuiltInPluginInfo, type PackagePluginInfo, pluginInfos, type PluginInfo } from '../plugins.js';
import { useFuseSearch } from '../hooks/useFuseSearch';

const addPluginBody = css`
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;

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

  .plugin-list {
    display: flex;
    flex-direction: column;
    background: var(--grey-dark);
    border: 1px solid var(--grey);
    flex: 1;
    position: relative;

    .plugin-search {
      padding: 16px;
      border-bottom: 1px solid var(--grey);
    }

    .plugin {
      display: grid;
      grid-template-columns: 1fr auto;
      column-gap: 8px;
      padding: 24px 16px;
      align-items: center;
      border-bottom: 1px solid var(--grey);
    }

    .plugin-info {
      display: grid;
      grid-template-columns: 200px 1fr;
      column-gap: 32px;
      align-items: center;
    }

    .plugin-name {
      font-weight: 600;
    }
  }
`;

export const AddPluginModal: FC<{
  isOpen: boolean;
  onClose: () => void;
  onAddPlugin: (plugin: PluginLoadSpec) => void;
  onRemovePlugin: (plugin: PluginLoadSpec) => void;
}> = ({ isOpen, onClose, onAddPlugin, onRemovePlugin }) => {
  const { loadPackagePlugin, packageInstallLog, setPackageInstallLog } = useLoadPackagePlugin({
    onLog: (msg) => console.log(msg),
  });
  const plugins = useRecoilValue(pluginsState);
  const [searchText, setSearchText] = useState('');

  const isPluginInstalledInProject = (plugin: PluginInfo): boolean => {
    return plugins.some((p) => p.spec.id === plugin.id);
  };

  const [pluginLogModalOpen, togglePluginLogModal] = useToggle();
  const [addNPMPluginModalOpen, toggleAddNPMPluginModal] = useToggle();

  const addBuiltInPlugin = (info: BuiltInPluginInfo) => {
    onAddPlugin({
      id: info.id,
      type: 'built-in',
      name: info.name,
    });
  };

  const addPackagePlugin = async (info: PackagePluginInfo) => {
    togglePluginLogModal.setRight();

    const spec: PackagePluginLoadSpec = {
      type: 'package',
      id: `${info.package}@${info.tag}`,
      package: info.package,
      tag: info.tag,
    };

    try {
      setPackageInstallLog(`Installing plugin: ${info.name}...\n`);
      await loadPackagePlugin(spec);
      togglePluginLogModal.setLeft();
      toggleAddNPMPluginModal.setLeft();
      onAddPlugin(spec);
    } catch (err) {
      setPackageInstallLog((log) => `${log}\nError installing plugin: ${getError(err).message}`);
    }
  };

  const addPlugin = (info: PluginInfo) => {
    if (info.type === 'built-in') {
      addBuiltInPlugin(info);
    } else if (info.type === 'package') {
      addPackagePlugin(info);
    }
  };

  const removePlugin = (info: PluginInfo) => {
    const matchingPlugin = plugins.find((p) => p.spec.id === info.id);
    if (matchingPlugin) {
      onRemovePlugin(matchingPlugin.spec);
    }
  };

  const goToDocs = useOpenUrl('https://rivet.ironcladapp.com/docs/'); // TODO

  const [pluginStoreDirectory, setPluginStoreDirectory] = useState('');

  useAsyncEffect(async () => {
    try {
      const appDataDir = await appLocalDataDir();
      setPluginStoreDirectory(await join(appDataDir, 'plugins'));
    } catch (err) {
      console.error(err);
    }
  }, []);

  const copyPluginStoreDirectory = async () => {
    copyToClipboard(pluginStoreDirectory);
    toast.success('Copied plugin store directory to clipboard');
  };

  const sortedPlugins = pluginInfos.sort((a, b) => a.name.localeCompare(b.name));

  const searchedPlugins = useFuseSearch(sortedPlugins, searchText, [
    'id',
    'name',
    'description',
    'author',
    'github',
    'website',
  ]);

  return (
    <ModalTransition>
      {isOpen && (
        <Modal width="x-large" onClose={onClose} height="100%">
          <ModalHeader>
            <ModalTitle>Add Plugin</ModalTitle>
            <div className="plugin-search">
              <TextField
                placeholder="Search..."
                value={searchText}
                onChange={(e) => setSearchText((e.target as HTMLInputElement).value)}
              />
            </div>
          </ModalHeader>
          <ModalBody>
            <div css={addPluginBody}>
              <div className="plugin-list">
                <div className="plugins">
                  {searchedPlugins.map(({ item: pluginInfo }) => (
                    <div className="plugin" key={pluginInfo.id}>
                      <div className="plugin-info">
                        <div className="plugin-name-author">
                          <div className="plugin-name">{pluginInfo.name}</div>
                          <div className="plugin-author">By: {pluginInfo.author}</div>
                        </div>
                        <div className="plugin-description">{pluginInfo.description}</div>
                      </div>
                      <div className="plugin-actions">
                        {isPluginInstalledInProject(pluginInfo) ? (
                          <span className="installed">Installed</span>
                        ) : (
                          <Button appearance="primary" onClick={() => addPlugin(pluginInfo)}>
                            Add
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {!searchText && (
                    <div className="plugin custom-plugin" key="custom-plugin">
                      <div className="plugin-info">
                        <div className="plugin-name">NPM Plugin</div>
                        <div className="plugin-description">Add a plugin from NPM manually</div>
                      </div>
                      <div className="plugin-actions">
                        <Button appearance="default" onClick={toggleAddNPMPluginModal.setRight}>
                          Add
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <AddNPMPluginModal
                isOpen={addNPMPluginModalOpen}
                onClose={toggleAddNPMPluginModal.setLeft}
                onAddPlugin={addPackagePlugin}
              />

              <PluginLogModal
                isOpen={pluginLogModalOpen}
                log={packageInstallLog}
                onClose={togglePluginLogModal.setLeft}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <div className="helperMessage">
              <HelperMessage>
                Plugins are stored in: <code>{pluginStoreDirectory}</code>{' '}
                <CopyIcon className="copy-plugin-dir-button" onClick={copyPluginStoreDirectory} />
              </HelperMessage>
            </div>
            <Button appearance="subtle" onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </ModalTransition>
  );
};

const PluginLogModal: FC<{
  isOpen: boolean;
  log: string;
  onClose: () => void;
}> = ({ isOpen, log, onClose }) => {
  const logPreRef = useRef<HTMLPreElement>(null);

  useLayoutEffect(() => {
    if (logPreRef.current) {
      logPreRef.current.scrollTop = logPreRef.current.scrollHeight;
    }
  }, [log]);

  return (
    <ModalTransition>
      {isOpen && (
        <Modal width="large" onClose={onClose}>
          <ModalHeader>
            <ModalTitle>Installing...</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <div className="plugin-log">
              <pre style={{ whiteSpace: 'pre-wrap' }} ref={logPreRef}>
                {log}
              </pre>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </Modal>
      )}
    </ModalTransition>
  );
};

const AddNPMPluginModal: FC<{
  isOpen: boolean;
  onClose: () => void;
  onAddPlugin: (plugin: PackagePluginInfo) => void;
}> = ({ isOpen, onClose, onAddPlugin }) => {
  const [pluginName, setPluginName] = useState('');
  const [pluginVersion, setPluginVersion] = useState('');

  const addPlugin = () => {
    const version = pluginVersion.trim() || 'latest';
    onAddPlugin({
      type: 'package',
      id: `${pluginName}@${version}`,
      package: pluginName,
      tag: version,
      author: '',
      name: pluginName,
      description: '',
    });
  };

  return (
    <ModalTransition>
      {isOpen && (
        <Modal width="large" onClose={onClose}>
          <ModalHeader>
            <ModalTitle>Add NPM Plugin</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <div className="add-npm-plugin">
              <div className="inputs">
                <Field name="packageName" label="Package Name">
                  {({ fieldProps }) => (
                    <TextField
                      {...fieldProps}
                      placeholder="Package Name"
                      value={pluginName}
                      onChange={(e) => setPluginName((e.target as HTMLInputElement).value)}
                    />
                  )}
                </Field>
                <Field name="packageVersion" label="Version">
                  {({ fieldProps }) => (
                    <TextField
                      {...fieldProps}
                      placeholder="Latest"
                      value={pluginVersion}
                      onChange={(e) => setPluginVersion((e.target as HTMLInputElement).value)}
                    />
                  )}
                </Field>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Cancel</Button>
            <Button appearance="primary" onClick={addPlugin}>
              Add
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </ModalTransition>
  );
};
