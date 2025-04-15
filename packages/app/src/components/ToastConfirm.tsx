import Button from '@atlaskit/button';
import type React from 'react';
import "react-toastify/dist/ReactToastify.css";

interface ToastConfirmProps {
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  closeToast?: () => void;
  onCancel?: () => void;
  children: React.ReactNode;
}

// Define the App component
export const ToastConfirm: React.FC<ToastConfirmProps> = ({
  confirmText = 'Ok',
  cancelText = 'Cancel',
  onConfirm,
  closeToast,
  onCancel = closeToast,
  children,
}) => {
  return (
  <div>
    <span style={{ fontSize: '12px' }}>
      {children}
    </span>

    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
      <Button onClick={onConfirm} style={{ margin: '5px', marginTop: '10px', fontSize: '12px' }} appearance="primary">
        {confirmText}
      </Button>
      <Button onClick={onCancel} style={{ margin: '5px', marginTop: '10px', fontSize: '12px' }} appearance="primary">
        {cancelText}
      </Button>
    </div>
  </div>
  );
};
