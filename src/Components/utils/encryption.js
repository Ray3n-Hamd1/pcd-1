// utils/encryption.js

/**
 * Encrypts a file using AES-GCM encryption
 * @param {File} file - The file to encrypt
 * @returns {Promise<Object>} - Object containing encrypted blob, key, and IV
 */
export const encryptFile = async (file) => {
    try {
      // Read the file
      const arrayBuffer = await file.arrayBuffer();
      const fileData = new Uint8Array(arrayBuffer);
      
      // Generate a random encryption key and IV
      const key = await window.crypto.subtle.generateKey(
        {
          name: "AES-GCM",
          length: 256,
        },
        true,
        ["encrypt", "decrypt"]
      );
      
      // Export the key to raw format for storage
      const exportedKey = await window.crypto.subtle.exportKey("raw", key);
      
      // Generate a random IV
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      
      console.log('Encrypting file:', file.name, 'Size:', file.size);
      
      // Encrypt the file data
      const encryptedData = await window.crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: iv,
          tagLength: 128, // standard for AES-GCM
        },
        key,
        fileData
      );
      
      console.log('Encryption complete. Encrypted size:', encryptedData.byteLength);
      
      // Create a Blob with the file's mime type
      const encryptedBlob = new Blob([encryptedData], { 
        type: "application/octet-stream" 
      });
      
      // Store original mime type in the file name if we want to restore it later
      const encryptedFileName = `${file.name}__${file.type}`;
      
      // Convert the key and IV to Base64 strings for storage
      const keyBase64 = arrayBufferToBase64(exportedKey);
      const ivBase64 = arrayBufferToBase64(iv);
      
      console.log('Key and IV generated and converted to Base64');
      
      return {
        encryptedBlob,
        encryptedFileName,
        key: keyBase64,
        iv: ivBase64,
        mimeType: file.type
      };
    } catch (error) {
      console.error("Encryption error:", error);
      throw new Error(`File encryption failed: ${error.message}`);
    }
  };
  
  /**
   * Decrypts a file using AES-GCM encryption
   * @param {Blob} encryptedBlob - The encrypted file blob
   * @param {string} keyBase64 - The encryption key in Base64 format
   * @param {string} ivBase64 - The IV in Base64 format
   * @param {string} originalMimeType - Original file MIME type
   * @returns {Promise<Blob>} - Decrypted file as a Blob
   */
  export const decryptFile = async (encryptedBlob, keyBase64, ivBase64, originalMimeType = '') => {
    try {
      console.log('Starting decryption process');
      
      // Convert Base64 strings back to ArrayBuffers
      const keyArrayBuffer = base64ToArrayBuffer(keyBase64);
      const iv = base64ToArrayBuffer(ivBase64);
      
      // Import the key
      const key = await window.crypto.subtle.importKey(
        "raw",
        keyArrayBuffer,
        {
          name: "AES-GCM",
          length: 256,
        },
        false,
        ["decrypt"]
      );
      
      console.log('Key imported for decryption');
      
      // Read the encrypted file
      const encryptedArrayBuffer = await encryptedBlob.arrayBuffer();
      
      // Decrypt the file
      const decryptedData = await window.crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: iv,
          tagLength: 128, // standard for AES-GCM
        },
        key,
        encryptedArrayBuffer
      );
      
      console.log('Decryption completed. Size:', decryptedData.byteLength);
      
      // Try to determine the original MIME type from the filename if available
      let detectedMimeType = originalMimeType;
      if (!detectedMimeType) {
        const fileName = encryptedBlob.name || '';
        const mimeTypeParts = fileName.match(/__(.+)$/);
        if (mimeTypeParts && mimeTypeParts[1]) {
          detectedMimeType = mimeTypeParts[1];
        } else {
          // Default to octet-stream if we can't determine the type
          detectedMimeType = 'application/octet-stream';
        }
      }
      
      // Convert the decrypted data to a Blob
      const decryptedBlob = new Blob([decryptedData], { type: detectedMimeType });
      
      return decryptedBlob;
    } catch (error) {
      console.error("Decryption error:", error);
      throw new Error(`File decryption failed: ${error.message}`);
    }
  };
  
  /**
   * Determines the most appropriate file MIME type
   * @param {string} fileName - The file name
   * @returns {string} - MIME type string
   */
  export const determineMimeType = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    const mimeTypes = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'txt': 'text/plain',
      'csv': 'text/csv',
      'html': 'text/html',
      'htm': 'text/html',
      'zip': 'application/zip',
      'mp3': 'audio/mpeg',
      'mp4': 'video/mp4',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime',
      'json': 'application/json',
      'xml': 'application/xml',
    };
    
    return mimeTypes[extension] || 'application/octet-stream';
  };
  
  /**
   * Converts an ArrayBuffer to a Base64 string
   * @param {ArrayBuffer} buffer - The buffer to convert
   * @returns {string} - Base64 encoded string
   */
  const arrayBufferToBase64 = (buffer) => {
    if (!buffer) return '';
    
    const bytes = new Uint8Array(buffer);
    let binary = '';
    
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    return window.btoa(binary);
  };
  
  /**
   * Converts a Base64 string to an ArrayBuffer
   * @param {string} base64 - The Base64 string to convert
   * @returns {ArrayBuffer} - Decoded ArrayBuffer
   */
  const base64ToArrayBuffer = (base64) => {
    try {
      const binaryString = window.atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      return bytes.buffer;
    } catch (error) {
      console.error('Error converting base64 to ArrayBuffer:', error);
      throw new Error('Failed to convert encryption key or IV');
    }
  };