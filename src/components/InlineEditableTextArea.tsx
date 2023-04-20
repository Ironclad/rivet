import { css } from '@emotion/react';
import { useState, useRef, useEffect, FC } from 'react';

interface InlineEditableTextAreaProps {
  value: string;
  placeholder?: string;
  onChange?: (newValue: string) => void;
}

const style = css`
  font-family: 'Roboto Mono', monospace;
  color: var(--foreground);
  font-size: 14px;

  &:hover {
    cursor: pointer;
    background-color: var(--grey-subtle-accent);
  }

  .value {
  }

  .placeholder {
    color: var(--foreground-muted);
  }

  textarea {
    width: 100%;
    height: 100%;
    border: none;
    background-color: var(--grey-subtle-accent);
    color: var(--foreground);
    font-size: 14px;
  }
`;

export const InlineEditableTextArea: FC<InlineEditableTextAreaProps> = ({ value, placeholder, onChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleBlur = () => {
    if (inputRef.current) {
      onChange?.(inputRef.current.value);
    }
    setIsEditing(false);
  };

  return (
    <div className="inline-editable-text-area" onClick={() => !isEditing && setIsEditing(true)} css={style}>
      {isEditing ? (
        <textarea ref={inputRef} defaultValue={value} onBlur={handleBlur} />
      ) : value ? (
        <span className="value">{value}</span>
      ) : (
        <span className="placeholder">{placeholder}</span>
      )}
    </div>
  );
};
