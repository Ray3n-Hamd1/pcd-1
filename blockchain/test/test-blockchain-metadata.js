const Web3 = require('web3');

// Connect to local Ganache instance
const web3 = new Web3('http://127.0.0.1:7545');

// Updated contract address
const contractAddress = '0xfe526fB1A4aF3aDa856925a8ee248a13e772466D';
const contractABI = [{
  "inputs": [],
  "stateMutability": "nonpayable",
  "type": "constructor"
},
{
  "anonymous": false,
  "inputs": [
      {
          "indexed": true,
          "internalType": "bytes32",
          "name": "fileId",
          "type": "bytes32"
      }
  ],
  "name": "FileArchived",
  "type": "event"
},
{
  "anonymous": false,
  "inputs": [
      {
          "indexed": true,
          "internalType": "bytes32",
          "name": "fileId",
          "type": "bytes32"
      },
      {
          "indexed": true,
          "internalType": "address",
          "name": "uploader",
          "type": "address"
      },
      {
          "indexed": false,
          "internalType": "string",
          "name": "fileName",
          "type": "string"
      }
  ],
  "name": "FileRegistered",
  "type": "event"
},
{
  "anonymous": false,
  "inputs": [
      {
          "indexed": true,
          "internalType": "address",
          "name": "previousOwner",
          "type": "address"
      },
      {
          "indexed": true,
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
      }
  ],
  "name": "OwnershipTransferred",
  "type": "event"
},
{
  "anonymous": false,
  "inputs": [
      {
          "indexed": true,
          "internalType": "address",
          "name": "uploader",
          "type": "address"
      }
  ],
  "name": "UploaderAdded",
  "type": "event"
},
{
  "anonymous": false,
  "inputs": [
      {
          "indexed": true,
          "internalType": "address",
          "name": "uploader",
          "type": "address"
      }
  ],
  "name": "UploaderRemoved",
  "type": "event"
},
{
  "inputs": [
      {
          "internalType": "address",
          "name": "uploaderAddress",
          "type": "address"
      }
  ],
  "name": "addUploader",
  "outputs": [],
  "stateMutability": "nonpayable",
  "type": "function"
},
{
  "inputs": [
      {
          "internalType": "bytes32",
          "name": "_fileId",
          "type": "bytes32"
      }
  ],
  "name": "archiveFile",
  "outputs": [],
  "stateMutability": "nonpayable",
  "type": "function"
},
{
  "inputs": [
      {
          "internalType": "bytes32",
          "name": "_fileId",
          "type": "bytes32"
      }
  ],
  "name": "getFileMetadata",
  "outputs": [
      {
          "components": [
              {
                  "internalType": "address",
                  "name": "uploader",
                  "type": "address"
              },
              {
                  "internalType": "uint256",
                  "name": "uploadTimestamp",
                  "type": "uint256"
              },
              {
                  "internalType": "string",
                  "name": "fileName",
                  "type": "string"
              },
              {
                  "internalType": "string",
                  "name": "encryptionKeyHash",
                  "type": "string"
              },
              {
                  "internalType": "bool",
                  "name": "isActive",
                  "type": "bool"
              }
          ],
          "internalType": "struct FileEncryptionRegistry.FileMetadata",
          "name": "",
          "type": "tuple"
      }
  ],
  "stateMutability": "view",
  "type": "function"
},
{
  "inputs": [],
  "name": "getUserFiles",
  "outputs": [
      {
          "internalType": "bytes32[]",
          "name": "",
          "type": "bytes32[]"
      }
  ],
  "stateMutability": "view",
  "type": "function"
},
{
  "inputs": [
      {
          "internalType": "address",
          "name": "_address",
          "type": "address"
      }
  ],
  "name": "isUploader",
  "outputs": [
      {
          "internalType": "bool",
          "name": "",
          "type": "bool"
      }
  ],
  "stateMutability": "view",
  "type": "function"
},
{
  "inputs": [],
  "name": "owner",
  "outputs": [
      {
          "internalType": "address",
          "name": "",
          "type": "address"
      }
  ],
  "stateMutability": "view",
  "type": "function"
},
{
  "inputs": [
      {
          "internalType": "string",
          "name": "_fileName",
          "type": "string"
      },
      {
          "internalType": "string",
          "name": "_encryptionKeyHash",
          "type": "string"
      }
  ],
  "name": "registerFile",
  "outputs": [
      {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
      }
  ],
  "stateMutability": "nonpayable",
  "type": "function"
},
{
  "inputs": [
      {
          "internalType": "address",
          "name": "uploaderAddress",
          "type": "address"
      }
  ],
  "name": "removeUploader",
  "outputs": [],
  "stateMutability": "nonpayable",
  "type": "function"
},
{
  "inputs": [],
  "name": "totalFiles",
  "outputs": [
      {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
      }
  ],
  "stateMutability": "view",
  "type": "function"
},
{
  "inputs": [
      {
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
      }
  ],
  "name": "transferOwnership",
  "outputs": [],
  "stateMutability": "nonpayable",
  "type": "function"
},
{
  "inputs": [
      {
          "internalType": "address",
          "name": "",
          "type": "address"
      }
  ],
  "name": "userProfiles",
  "outputs": [
      {
          "internalType": "bool",
          "name": "isUploader",
          "type": "bool"
      },
      {
          "internalType": "uint256",
          "name": "totalFilesUploaded",
          "type": "uint256"
      }
  ],
  "stateMutability": "view",
  "type": "function"
}];


async function decodeInputData(data) {
    // Remove the function selector (first 4 bytes / 8 characters after '0x')
    const inputData = data.slice(10);
    
    try {
        // Decode parameters according to their types
        const decodedParameters = web3.eth.abi.decodeParameters(
            ['string', 'string'],  // Parameter types: filename, encryptionKey
            inputData
        );
        
        return {
            fileName: decodedParameters[0],
            encryptionKey: decodedParameters[1]
        };
    } catch (error) {
        console.error('Error decoding input data:', error);
        return null;
    }
}

async function getTransactionDetails(txHash) {
    try {
        console.log('🔍 Retrieving transaction details for:', txHash);
        
        // Get transaction
        const tx = await web3.eth.getTransaction(txHash);
        const receipt = await web3.eth.getTransactionReceipt(txHash);
        
        console.log('\n📦 Transaction Information:');
        console.log('=======================');
        console.log(`Hash: ${tx.hash}`);
        console.log(`Block Number: ${tx.blockNumber}`);
        console.log(`From: ${tx.from}`);
        console.log(`To: ${tx.to}`);
        
        // Decode input data
        const decodedData = await decodeInputData(tx.input);
        if (decodedData) {
            console.log('\n📄 Decoded Input Data:');
            console.log('===================');
            console.log(`File Name: ${decodedData.fileName}`);
            console.log(`Encryption Key: ${decodedData.encryptionKey}`);
        }
        
        // Process logs
        if (receipt.logs && receipt.logs.length > 0) {
            console.log('\n📝 Event Logs:');
            console.log('============');
            for (const log of receipt.logs) {
                console.log(`Log Topics:`, log.topics);
                console.log(`Log Data:`, log.data);
                
                // Try to decode the log data
                try {
                    const decodedLog = web3.eth.abi.decodeLog(
                        [
                            {
                                type: 'string',
                                name: 'fileName',
                                indexed: false
                            },
                            {
                                type: 'string',
                                name: 'encryptionKey',
                                indexed: false
                            }
                        ],
                        log.data,
                        log.topics.slice(1) // Remove event signature topic
                    );
                    console.log('\n🔑 Decoded Log Data:');
                    console.log('================');
                    console.log(decodedLog);
                } catch (error) {
                    console.log('Could not decode log data:', error.message);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        console.error('Error Details:', error.message);
    }
}

// Use the provided transaction hash
const txHash = '0x8db895e3421355ae19bdb1374882c2af411c7dcb42635bd33d8042c704c68c7f';
getTransactionDetails(txHash);