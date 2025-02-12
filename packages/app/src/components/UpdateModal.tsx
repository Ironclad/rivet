import { useState, type FC } from 'react';

import Modal, { ModalTransition, ModalBody, ModalFooter, ModalHeader, ModalTitle } from '@atlaskit/modal-dialog';
import { useAtom, useSetAtom } from 'jotai';
import { skippedMaxVersionState, updateModalOpenState, updateStatusState } from '../state/settings';
import Button from '@atlaskit/button';
import useAsyncEffect from 'use-async-effect';
import { checkUpdate, installUpdate } from '@tauri-apps/api/updater';
import { getVersion } from '@tauri-apps/api/app';
import { css } from '@emotion/react';
import { useMarkdown } from '../hooks/useMarkdown';
import { relaunch } from '@tauri-apps/api/process';
import { syncWrapper } from '../utils/syncWrapper';

const bodyStyle = css`
  pre {
    font-family: var(--font-family);
  }
`;

export const UpdateModalRenderer: FC = () => {
  const [modalOpen] = useAtom(updateModalOpenState);

  return <ModalTransition>{modalOpen && <UpdateModal />}</ModalTransition>;
};

export const UpdateModal: FC = () => {
  const setModalOpen = useSetAtom(updateModalOpenState);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useAtom(updateStatusState);
  const setSkippedMaxVersion = useSetAtom(skippedMaxVersionState);

  const [currentVersion, setCurrentVersion] = useState('');
  const [latestVersion, setLatestVersion] = useState('');
  const [updateBody, setUpdateBody] = useState('');

  useAsyncEffect(async () => {
    setCurrentVersion(await getVersion());
    const { manifest } = await checkUpdate();
    if (manifest) {
      setLatestVersion(manifest.version);
      setUpdateBody(manifest.body);
    }
  }, []);

  const doUpdate = async () => {
    try {
      setUpdateStatus('Starting update...');
      setIsUpdating(true);

      await installUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const handleModalClose = () => {
    if (isUpdating) {
      return;
    }
    setModalOpen(false);
  };

  const skipUpdate = () => {
    setSkippedMaxVersion(latestVersion);
    handleModalClose();
  };

  const canRender = currentVersion && latestVersion && updateBody;

  const markdownBody = useMarkdown(updateBody ?? '', !!canRender);

  return (
    canRender && (
      <Modal width="large" onClose={handleModalClose}>
        <ModalHeader>
          <ModalTitle>🎉 Update Available</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div css={bodyStyle}>
            <p>
              A new version <strong>{latestVersion}</strong> of Rivet is available. You are on currently on version{' '}
              <strong>{currentVersion}</strong>. Would you like to install it now?
            </p>
            <h4>Update Notes:</h4>
            <div dangerouslySetInnerHTML={markdownBody} />
          </div>
        </ModalBody>
        <ModalFooter>
          {isUpdating ? (
            updateStatus === 'Installed.' ? (
              <Button appearance="primary" onClick={syncWrapper(relaunch)}>
                Update complete! Click to restart.
              </Button>
            ) : (
              <div>{updateStatus}</div>
            )
          ) : (
            <>
              <Button appearance="primary" onClick={syncWrapper(doUpdate)}>
                Update
              </Button>
              <Button appearance="subtle" onClick={skipUpdate}>
                Skip this update
              </Button>
              <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            </>
          )}
        </ModalFooter>
      </Modal>
    )
  );
};
