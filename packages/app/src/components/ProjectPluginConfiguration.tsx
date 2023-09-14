import { HelperMessage, Label } from '@atlaskit/form';
import { produce } from 'immer';
import { FC, useState } from 'react';
import { useRecoilState } from 'recoil';
import { projectPluginsState } from '../state/savedGraphs';
import TextField from '@atlaskit/textfield';
import { ReactComponent as PlusIcon } from 'majesticons/line/plus-line.svg';
import Modal, { ModalTransition, ModalTitle, ModalHeader, ModalFooter, ModalBody } from '@atlaskit/modal-dialog';
import { ReactComponent as MoreMenuVerticalIcon } from 'majesticons/line/more-menu-vertical-line.svg';
import { ReactComponent as DeleteBinIcon } from 'majesticons/line/delete-bin-line.svg';
import { ReactComponent as LightningIcon } from 'majesticons/line/lightning-bolt-line.svg';
import Button from '@atlaskit/button';
import Tabs, { Tab, TabList, TabPanel } from '@atlaskit/tabs';
import { useToggle } from 'ahooks';
import { PluginLoadSpec } from '../../../core/src/model/PluginLoadSpec';
import Select from '@atlaskit/select';
import { Field } from '@atlaskit/form';
import styled from '@emotion/styled';
import { css } from '@emotion/react';
import Popup from '@atlaskit/popup';
import { MenuGroup, ButtonItem } from '@atlaskit/menu';
import { useBuiltInPlugins } from '../hooks/useBuiltInPlugins';
import { toast } from 'react-toastify';
import { RivetPluginInitializer } from '@ironclad/rivet-core';
import * as Rivet from '@ironclad/rivet-core';
import { useOpenUrl } from '../hooks/useOpenUrl';

const styles = css`
  .label {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .add-plugin,
  .plugin-dropdown {
    cursor: pointer;
    font-size: 16px;
    color: var(--grey);
    transition: color 0.2s ease, border-color 0.2s ease;
    border-radius: 4px;
    border: 0;
    width: 24px;
    height: 24px;
    background: transparent;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 0;
    padding: 0;

    &:hover {
      border: 1px solid var(--foreground-bright);
      color: var(--foreground-bright);
    }
  }

  .add-plugin {
    border: 1px solid var(--grey);
  }

  .plugins-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0;
    padding: 0;
    margin-top: 8px;

    li {
      margin: 0;
      padding: 0;

      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      border-bottom: 1px solid var(--grey-darkish);
      padding: 4px 8px;

      .plugin-info {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex: 1;
        gap: 8px;
      }

      .plugin-id {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    }
  }
`;

export const ProjectPluginsConfiguration: FC = () => {
  const [pluginSpecs, setPluginSpecs] = useRecoilState(projectPluginsState);
  const [addPluginModalOpen, toggleAddPluginModal] = useToggle();

  const addPlugin = (plugin: PluginLoadSpec) => {
    toggleAddPluginModal.setLeft();

    setPluginSpecs((specs) =>
      produce(specs, (draft) => {
        if (draft.find((s) => s.id === plugin.id)) {
          return;
        }

        draft.push(plugin);
      }),
    );
  };

  const deletePlugin = (spec: PluginLoadSpec) => {
    setPluginSpecs((specs) => specs.filter((s) => s.id !== spec.id));
  };

  return (
    <div css={styles}>
      <div className="label">
        <Label htmlFor="">Plugins</Label>
        <button className="add-plugin" onClick={toggleAddPluginModal.setRight}>
          <PlusIcon />
        </button>
      </div>
      <ul className="plugins-list">
        {pluginSpecs.map((spec, i) => (
          <PluginConfigurationItem spec={spec} key={`spec-${i}`} onDelete={deletePlugin} />
        ))}
      </ul>

      <AddPluginModal isOpen={addPluginModalOpen} onClose={toggleAddPluginModal.setLeft} onAddPlugin={addPlugin} />
    </div>
  );
};

const PluginConfigurationItem: FC<{ spec: PluginLoadSpec; onDelete?: (spec: PluginLoadSpec) => void }> = ({
  spec,
  onDelete,
}) => {
  const [isOpen, toggleOpen] = useToggle();

  return (
    <li className="plugin">
      <div className="plugin-info">
        <div className="plugin-id">
          <LightningIcon />
          {spec.id}
        </div>
        <div className="plugin-type">{spec.type}</div>
      </div>
      <Popup
        isOpen={isOpen}
        onClose={toggleOpen.setLeft}
        content={() => (
          <MenuGroup>
            <ButtonItem
              iconBefore={<DeleteBinIcon />}
              onClick={() => {
                onDelete?.(spec);
                toggleOpen.setLeft();
              }}
            >
              Delete
            </ButtonItem>
          </MenuGroup>
        )}
        placement="bottom-end"
        trigger={(triggerProps) => (
          <button className="plugin-dropdown" {...triggerProps} onClick={toggleOpen.setRight}>
            <MoreMenuVerticalIcon />
          </button>
        )}
      />
    </li>
  );
};

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
`;

const AddPluginModal: FC<{
  isOpen: boolean;
  onClose: () => void;
  onAddPlugin: (plugin: PluginLoadSpec) => void;
}> = ({ isOpen, onClose, onAddPlugin }) => {
  const [pluginUri, setPluginUri] = useState('');
  const [selectedBuiltInPlugin, setSelectedBuiltInPlugin] = useState<string | undefined>();
  const builtInPlugins = useBuiltInPlugins();
  const [loadingPlugin, toggleLoadingPlugin] = useToggle();

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
    }
  };

  const goToDocs = useOpenUrl('https://rivet.ironcladapp.com/docs/'); // TODO

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
