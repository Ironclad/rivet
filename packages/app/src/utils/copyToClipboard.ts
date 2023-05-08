export const copyToClipboard = (text: string) => {
  const textarea = document.createElement('textarea');
  textarea.textContent = text;
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
};
