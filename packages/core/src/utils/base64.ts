export async function uint8ArrayToBase64(uint8Array: Uint8Array) {
  if (typeof window === 'undefined') {
    // Node executor
    return Buffer.from(uint8Array).toString('base64');
  } else {
    // Browser executor
    const blob = new Blob([uint8Array], { type: 'application/octet-stream' });
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
    return dataUrl.split(',')[1];
  }
}

export function base64ToUint8Array(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
