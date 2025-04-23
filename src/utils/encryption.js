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
      key: Buffer.from(exportedKey).toString('hex'),
      iv: Buffer.from(iv).toString('hex'),
    };
  }