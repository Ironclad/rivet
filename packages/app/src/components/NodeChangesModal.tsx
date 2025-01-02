import { type FC } from 'react';
import Modal, { ModalBody, ModalTransition, ModalTitle, ModalFooter, ModalHeader } from '@atlaskit/modal-dialog';
import { useAtomValue, useSetAtom } from 'jotai';
import { viewingNodeChangesState } from '../state/graphBuilder';
import { useHistoricalNodeChangeInfo } from '../hooks/useHistoricalNodeChangeInfo';
import * as yaml from 'yaml';
import { diffStringsUnified } from 'jest-diff';

export const NodeChangesModalRenderer: FC = () => {
  const changes = useAtomValue(viewingNodeChangesState);

  return <ModalTransition>{changes == null ? null : <NodeChangesModal />}</ModalTransition>;
};

export const NodeChangesModal: FC = () => {
  const nodeId = useAtomValue(viewingNodeChangesState);
  const changes = useHistoricalNodeChangeInfo(nodeId!);
  const setViewingNodeChanges = useSetAtom(viewingNodeChangesState);

  if (changes == null || changes.changed === false) {
    return null;
  }

  const beforeYaml = changes.before ? yaml.stringify(changes.before) : '';
  const afterYaml = changes.after ? yaml.stringify(changes.after!) : '';

  const yamlDiff = diffStringsUnified(beforeYaml, afterYaml, {
    contextLines: 5,
    expand: false,
    aAnnotation: 'Before',
    bAnnotation: 'After',
    aColor: (str) => `<span style="color: #e74c3c;">${str}</span>`,
    bColor: (str) => `<span style="color: #00b74c;">${str}</span>`,
  });

  return (
    <Modal
      width="xlarge"
      autoFocus={false}
      onClose={() => {
        setViewingNodeChanges(undefined);
      }}
    >
      <ModalHeader>
        <ModalTitle>Node Changes</ModalTitle>
      </ModalHeader>
      <ModalBody>
        <pre style={{ whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: yamlDiff }} />
      </ModalBody>
      <ModalFooter />
    </Modal>
  );
};
