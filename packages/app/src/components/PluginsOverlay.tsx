import { HelperMessage, Field } from '@atlaskit/form';
import { type FC, useState, useRef, useLayoutEffect } from 'react';
import TextField from '@atlaskit/textfield';
import Button from '@atlaskit/button';
import { useToggle } from 'ahooks';
import { toast } from 'react-toastify';
import { getError } from '@ironclad/rivet-core';
import { useOpenUrl } from '../hooks/useOpenUrl';
import { type PackagePluginLoadSpec, type PluginLoadSpec } from '../../../core/src/model/PluginLoadSpec';
import { css } from '@emotion/react';
import { appLocalDataDir, join } from '@tauri-apps/api/path';
import CopyIcon from 'majesticons/line/clipboard-line.svg?react';
import GithubMark from '../assets/vendor_logos/github-mark-white.svg?react';
import { copyToClipboard } from '../utils/copyToClipboard';
import { useLoadPackagePlugin } from '../hooks/useLoadPackagePlugin';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { pluginsState } from '../state/plugins';
import useAsyncEffect from 'use-async-effect';
import { type BuiltInPluginInfo, type PackagePluginInfo, pluginInfos, type PluginInfo } from '../plugins.js';
import { useFuseSearch } from '../hooks/useFuseSearch';
import { overlayOpenState } from '../state/ui';
import { ErrorBoundary } from 'react-error-boundary';
import Modal, { ModalTransition, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@atlaskit/modal-dialog';
import clsx from 'clsx';
import { useMarkdown } from '../hooks/useMarkdown';
import { projectPluginsState } from '../state/savedGraphs';
import { produce } from 'immer';

const styles = css`
  position: fixed;
  left: 250px;
  top: var(--project-selector-height);
  right: 0;
  bottom: 0;
  background: var(--grey-darker);
  padding: 64px 32px 0 32px;
  z-index: 150;

  display: flex;
  flex-direction: column;

  > header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--grey);
  }

  > main {
    flex: 1 1 auto;
    overflow: auto;
    min-height: 0;
  }

  > footer {
    border-top: 1px solid var(--grey);
    display: flex;
    align-items: center;
    padding: 16px 0;
  }
`;

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
      grid-template-columns: 64px 200px 1fr auto;
      row-gap: 8px;
      column-gap: 32px;
      padding: 24px 16px;
      align-items: center;
      border-bottom: 1px solid var(--grey);
    }

    .plugin-icon {
      width: 64px;
      height: 64px;
      grid-column: 1;
      grid-row: 1 / -1;

      &.missing {
        border: 1px solid var(--grey);
      }

      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }

    .plugin-name {
      font-weight: 600;
    }

    .plugin-actions {
      display: flex;
      align-items: center;
      align-self: end;
      grid-column: -1;
    }

    .plugin-name-author {
      grid-column: 2;
    }

    .plugin-links {
      grid-column: 2;

      a {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      svg {
        width: 16px;
        height: 16px;
      }
    }

    .plugin-description {
      grid-column: 3;
      grid-row: 1 / -1;
    }
  }
`;

export const PluginsOverlayRenderer: FC = () => {
  const [openOverlay] = useRecoilState(overlayOpenState);

  if (openOverlay !== 'plugins') return null;

  return (
    <ErrorBoundary fallbackRender={() => 'Failed to render Plugins overlay'}>
      <PluginsOverlay />
    </ErrorBoundary>
  );
};

export const PluginsOverlay: FC = () => {
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
  const setPluginSpecs = useSetRecoilState(projectPluginsState);

  const addPluginSpec = (spec: PluginLoadSpec) => {
    setPluginSpecs((specs) =>
      produce(specs, (draft) => {
        if (draft.find((s) => s.id === spec.id)) {
          return;
        }

        draft.push(spec);
      }),
    );
  };

  const addBuiltInPlugin = (info: BuiltInPluginInfo) => {
    addPluginSpec({
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
      addPluginSpec(spec);
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
    <div css={styles}>
      <header>
        <h1>Plugin</h1>
        <div className="plugin-search">
          <TextField
            autoComplete="off"
            spellCheck={false}
            placeholder="Search..."
            value={searchText}
            onChange={(e) => setSearchText((e.target as HTMLInputElement).value)}
          />
        </div>
      </header>
      <main>
        <div css={addPluginBody}>
          <div className="plugin-list">
            <div className="plugins">
              {searchedPlugins.map(({ item: pluginInfo }) => (
                <PluginListItem
                  key={pluginInfo.id}
                  plugin={pluginInfo}
                  isInstalled={isPluginInstalledInProject(pluginInfo)}
                  onAddPlugin={addPlugin}
                />
              ))}
              {!searchText && (
                <div className="plugin custom-plugin" key="custom-plugin">
                  <div className="plugin-icon" />
                  <div className="plugin-name-author">
                    <div className="plugin-name">NPM Plugin</div>
                  </div>
                  <div className="plugin-description">Add a plugin from NPM manually</div>
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

          <PluginLogModal isOpen={pluginLogModalOpen} log={packageInstallLog} onClose={togglePluginLogModal.setLeft} />
        </div>
      </main>
      <footer>
        <div className="helperMessage">
          <HelperMessage>
            Plugins are stored in: <code>{pluginStoreDirectory}</code>{' '}
            <CopyIcon className="copy-plugin-dir-button" onClick={copyPluginStoreDirectory} />
          </HelperMessage>
        </div>
      </footer>
    </div>
  );
};

const PluginListItem: FC<{
  plugin: PluginInfo;
  isInstalled: boolean;
  onAddPlugin: (plugin: PluginInfo) => void;
}> = ({ plugin, isInstalled, onAddPlugin }) => {
  const markdownDescription = useMarkdown(plugin.description);
  const itemRef = useRef<HTMLDivElement>(null);

  // Markdown links open new because tauri
  useLayoutEffect(() => {
    itemRef.current?.querySelectorAll('a').forEach((a) => {
      a.target = '_blank';
    });
  }, []);

  return (
    <div className="plugin" key={plugin.id} ref={itemRef}>
      <div className={clsx('plugin-icon', { missing: !plugin.logoImage })}>
        {plugin.logoImage && <img src={plugin.logoImage} alt={plugin.name} />}
      </div>
      <div className="plugin-name-author">
        <div className="plugin-name">{plugin.name}</div>
        <div className="plugin-author">By: {plugin.author}</div>
        {(plugin.github || plugin.website || plugin.documentation) && (
          <div className="plugin-links">
            {plugin.github && (
              <a className="plugin-github" href={plugin.github} target="_blank" rel="noreferrer">
                <GithubMark viewBox="0 0 100 100" /> GitHub
              </a>
            )}
            {plugin.website && (
              <a className="plugin-website" href={plugin.website} target="_blank" rel="noreferrer">
                Website
              </a>
            )}
            {plugin.documentation && (
              <a className="plugin-docs" href={plugin.documentation} target="_blank" rel="noreferrer">
                Docs
              </a>
            )}
          </div>
        )}
      </div>
      <div className="plugin-description" dangerouslySetInnerHTML={markdownDescription}></div>

      <div className="plugin-actions">
        {isInstalled ? (
          <span className="installed">Installed</span>
        ) : (
          <Button appearance="primary" onClick={() => onAddPlugin(plugin)}>
            Add
          </Button>
        )}
      </div>
    </div>
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
