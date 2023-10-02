import Button from '@atlaskit/button';
import Modal, { ModalTransition, ModalHeader, ModalBody, ModalFooter } from '@atlaskit/modal-dialog';
import { css } from '@emotion/react';
import { type RivetPlugin } from '@ironclad/rivet-core';
import { useState, type FC } from 'react';
import { match } from 'ts-pattern';
import { type PluginLoadSpec } from '../../../core/src/model/PluginLoadSpec';
import { appLocalDataDir, join } from '@tauri-apps/api/path';
import useAsyncEffect from 'use-async-effect';
import { CopyToClipboardButton } from './CopyToClipboardButton';

const pluginInfoModalBody = css`
  dl {
    display: grid;
    grid-template-columns: auto 1fr;
    column-gap: 32px;
    row-gap: 8px;
    margin: 0;
    padding: 0;

    dt {
      font-weight: bold;
      margin: 0;
      padding: 0;
    }

    dd {
      margin: 0;
      padding: 0;
    }
  }
`;

type PluginInfoModalProps = {
  isOpen: boolean;
  onClose: () => void;
  pluginName: string;
  spec: PluginLoadSpec;
  loadedPlugin?: RivetPlugin;
};

export const PluginInfoModal: FC<PluginInfoModalProps> = ({ isOpen, onClose, pluginName, spec, loadedPlugin }) => {
  const [installDir, setInstallDir] = useState('');

  useAsyncEffect(async () => {
    if (spec.type !== 'package') {
      return;
    }

    const localDataDir = await appLocalDataDir();

    const pluginDir = await join(localDataDir, `plugins/${spec.package}-${spec.tag}`);
    const pluginFilesPath = await join(pluginDir, 'package');

    setInstallDir(pluginFilesPath);
  }, []);

  return (
    <ModalTransition>
      {isOpen && (
        <Modal onClose={onClose} width="large">
          <ModalHeader>
            <h3>{pluginName}</h3>
          </ModalHeader>
          <ModalBody>
            <div css={pluginInfoModalBody}>
              {match(spec)
                .with({ type: 'built-in' }, (spec) => (
                  <dl>
                    <dt>Type</dt>
                    <dd>Built-In</dd>
                    <dt>Plugin</dt>
                    <dd>{spec.id}</dd>
                  </dl>
                ))
                .with({ type: 'uri' }, (spec) => (
                  <dl>
                    <dt>Type</dt>
                    <dd>URI</dd>
                    <dt>ID</dt>
                    <dd>{loadedPlugin?.id ?? spec.id}</dd>
                    <dt>URI</dt>
                    <dd>{spec.uri}</dd>
                    <dt>Name</dt>
                    <dd>{loadedPlugin?.name ?? 'Unknown'}</dd>
                  </dl>
                ))
                .with({ type: 'package' }, (spec) => (
                  <dl>
                    <dt>Type</dt>
                    <dd>Package</dd>
                    <dt>ID</dt>
                    <dd>{loadedPlugin?.id ?? spec.id}</dd>
                    <dt>Package</dt>
                    <dd>{spec.package}</dd>
                    <dt>Tag</dt>
                    <dd>{spec.tag}</dd>
                    <dt>Name</dt>
                    <dd>{loadedPlugin?.name ?? 'Unknown'}</dd>
                    <dt>Install Directory</dt>
                    <dd>
                      <code>{installDir}</code>
                      <CopyToClipboardButton text={installDir} />
                    </dd>
                  </dl>
                ))
                .exhaustive()}
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
