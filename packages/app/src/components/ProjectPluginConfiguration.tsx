import { Label } from '@atlaskit/form';
import { produce } from 'immer';
import { type FC } from 'react';
import { useRecoilState } from 'recoil';
import { projectPluginsState } from '../state/savedGraphs';
import { ReactComponent as PlusIcon } from 'majesticons/line/plus-line.svg';
import { ReactComponent as MoreMenuVerticalIcon } from 'majesticons/line/more-menu-vertical-line.svg';
import { ReactComponent as DeleteBinIcon } from 'majesticons/line/delete-bin-line.svg';
import { ReactComponent as LightningIcon } from 'majesticons/line/lightning-bolt-line.svg';
import { ReactComponent as InfoIcon } from 'majesticons/line/info-circle-line.svg';
import { useToggle } from 'ahooks';
import { type PluginLoadSpec } from '../../../core/src/model/PluginLoadSpec';
import { css } from '@emotion/react';
import Popup from '@atlaskit/popup';
import { MenuGroup, ButtonItem } from '@atlaskit/menu';
import { AddPluginModal } from './AddPluginModal';
import { useDependsOnPlugins } from '../hooks/useDependsOnPlugins';
import Modal, { ModalTransition, ModalHeader, ModalBody, ModalFooter } from '@atlaskit/modal-dialog';
import { match } from 'ts-pattern';
import Button from '@atlaskit/button';
import { type RivetPlugin } from '@ironclad/rivet-core';
import { PluginInfoModal } from './PluginInfoModal';

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

      <AddPluginModal
        isOpen={addPluginModalOpen}
        onClose={toggleAddPluginModal.setLeft}
        onAddPlugin={addPlugin}
        onRemovePlugin={deletePlugin}
      />
    </div>
  );
};

const PluginConfigurationItem: FC<{ spec: PluginLoadSpec; onDelete?: (spec: PluginLoadSpec) => void }> = ({
  spec,
  onDelete,
}) => {
  const [isOpen, toggleOpen] = useToggle();
  const [infoModalOpen, toggleInfoModal] = useToggle();

  const loadedPlugins = useDependsOnPlugins();

  const displayId = spec.type === 'package' ? spec.package : spec.id;
  const loadedPlugin = loadedPlugins.find((p) => p.id === displayId);
  const pluginName = loadedPlugins.find((p) => p.id === displayId)?.name ?? displayId;

  return (
    <li className="plugin">
      <div className="plugin-info">
        <div className="plugin-id">
          <LightningIcon style={{ flex: '0 0 auto' }} />
          {pluginName}
        </div>
      </div>
      <Popup
        isOpen={isOpen}
        onClose={toggleOpen.setLeft}
        content={() => (
          <MenuGroup>
            <ButtonItem
              iconBefore={<InfoIcon />}
              onClick={() => {
                toggleInfoModal.setRight();
                toggleOpen.setLeft();
              }}
            >
              Info
            </ButtonItem>

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
      <PluginInfoModal
        isOpen={infoModalOpen}
        onClose={toggleInfoModal.setLeft}
        pluginName={pluginName}
        spec={spec}
        loadedPlugin={loadedPlugin}
      />
    </li>
  );
};
