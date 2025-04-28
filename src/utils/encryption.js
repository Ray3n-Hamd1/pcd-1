// Browser-compatible function to convert ArrayBuffer to hex string
function arrayBufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Browser-compatible function to convert hex string to ArrayBuffer


// Updated encryption function for browser environments
export async function encryptFile(file) {
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM

  const fileBuffer = await file.arrayBuffer();

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    fileBuffer
  );

  const exportedKey = await crypto.subtle.exportKey("raw", key);

  return {
    encryptedBlob: new Blob([encryptedBuffer], { type: "application/octet-stream" }),
    key: arrayBufferToBase64(exportedKey),
    iv: arrayBufferToBase64(iv),
  };
}

// Decrypt file using Web Crypto API
export async function decryptFile(encryptedBlob, base64Key, base64Iv) {
  const keyBuffer = base64ToArrayBuffer(base64Key);
  const iv = base64ToArrayBuffer(base64Iv);

  const key = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "AES-GCM" },
    true,
    ["decrypt"]
  );

  const encryptedBuffer = await encryptedBlob.arrayBuffer();

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encryptedBuffer
  );

  return new Blob([decryptedBuffer], { type: "application/octet-stream" });
}

// Helper to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

// Helper to convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
// Browser-compatible function to decrypt files

function hexToArrayBuffer(hexString) {
  if (!hexString) {
    throw new Error('Empty hex string');
  }
  
  console.log("Converting hex string:", hexString.substring(0, 32) + "...");
  
  // Remove 0x prefix if present
  hexString = hexString.replace('0x', '');
  
  // Ensure even length
  if (hexString.length % 2 !== 0) {
    console.log("Adding leading zero to hex string");
    hexString = '0' + hexString;
  }
  
  const bytes = new Uint8Array(hexString.length / 2);
  try {
    for (let i = 0; i < hexString.length; i += 2) {
      bytes[i/2] = parseInt(hexString.substring(i, i + 2), 16);
    }
    console.log("Successfully converted hex to bytes, length:", bytes.length);
    return bytes.buffer;
  } catch (e) {
    console.error("Error parsing hex string:", e);
    throw new Error("Failed to parse hex string");
  }
}
// Helper function to convert hex string to Uint8Array
function hexToUint8Array(hexString) {
  if (!hexString) throw new Error('Missing hex string for conversion');
  
  // Remove '0x' prefix if present
  hexString = hexString.replace('0x', '');
  
  // Ensure even length
  if (hexString.length % 2 !== 0) {
    hexString = '0' + hexString;
  }
  
  const arrayBuffer = new Uint8Array(hexString.length / 2);
  
  for (let i = 0; i < hexString.length; i += 2) {
    arrayBuffer[i/2] = parseInt(hexString.substring(i, i + 2), 16);
  }
  
  return arrayBuffer;
}