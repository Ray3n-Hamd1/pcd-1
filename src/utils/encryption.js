// Browser-compatible function to convert ArrayBuffer to hex string
function arrayBufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Browser-compatible function to convert hex string to ArrayBuffer
function hexToArrayBuffer(hexString) {
  const bytes = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < hexString.length; i += 2) {
    bytes[i/2] = parseInt(hexString.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

// Updated encryption function for browser environments
export async function encryptFile(file) {
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await file.arrayBuffer();

  const encryptedContent = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  const exportedKey = await crypto.subtle.exportKey('raw', key);

  return {
    encryptedBlob: new Blob([new Uint8Array(encryptedContent)]),
    key: arrayBufferToHex(exportedKey),
    iv: arrayBufferToHex(iv),
  };
}