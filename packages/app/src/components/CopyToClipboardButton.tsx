import { type FC } from 'react';
import CopyIcon from '../assets/icons/copy-icon.svg?react';
import { css } from '@emotion/react';
import { copyToClipboard } from '../utils/copyToClipboard';
import { toast } from 'react-toastify';

const styles = css`
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  color: var(--foreground-dimmed);
  transition: color 0.2s ease-in-out;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  outline: 0;

  &:hover {
    color: var(--foreground);
  }
`;

export const CopyToClipboardButton: FC<{ text?: string }> = ({ text }) => {
  const doCopy = async () => {
    if (text == null) {
      return;
    }

    await copyToClipboard(text);

    toast.success('Copied to clipboard');
  };

  return (
    <button css={styles} onClick={doCopy}>
      <CopyIcon />
    </button>
  );
};
