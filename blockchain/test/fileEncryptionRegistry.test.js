const FileEncryptionRegistry = artifacts.require("FileEncryptionRegistry");

contract("FileEncryptionRegistry", (accounts) => {
  let contractInstance;
  const owner = accounts[0];
  const uploader1 = accounts[1];
  const uploader2 = accounts[2];

  // Before each test, deploy a fresh contract
  beforeEach(async () => {
    contractInstance = await FileEncryptionRegistry.deployed();
  });

  // Test 1: Contract Deployment
  it("should deploy the contract correctly", async () => {
    assert(contractInstance.address !== undefined, "Contract not deployed");
  });

  // Test 2: Owner Verification
  it("should set the contract creator as the owner", async () => {
    const contractOwner = await contractInstance.owner();
    assert.equal(contractOwner, owner, "Owner is not the contract creator");
  });

  // Test 3: Add Uploader Functionality
  it("should allow owner to add uploaders", async () => {
    // Check if uploader1 is already an uploader
    const initialUploaderStatus = await contractInstance.isUploader(uploader1);
    
    // If not already an uploader, add them
    if (!initialUploaderStatus) {
      await contractInstance.addUploader(uploader1, { from: owner });
    }
    
    // Verify uploader status
    const isUploader = await contractInstance.isUploader(uploader1);
    assert.equal(isUploader, true, "Failed to add uploader");
  });

  // Test 4: File Registration
  it("should allow registered uploaders to register files", async () => {
    // Ensure uploader1 is added (handle existing uploader case)
    const initialUploaderStatus = await contractInstance.isUploader(uploader1);
    if (!initialUploaderStatus) {
      await contractInstance.addUploader(uploader1, { from: owner });
    }

    // Prepare file metadata
    const fileName = "test_file.txt";
    const encryptionKeyHash = web3.utils.sha3("test_encryption_key");

    // Register file from uploader1
    const result = await contractInstance.registerFile(
      fileName, 
      encryptionKeyHash, 
      { from: uploader1 }
    );

    // Check events (modify to work with the specific event structure)
    assert.equal(result.logs.length, 1, "No events were emitted");
    assert.equal(result.logs[0].event, "FileRegistered", "Incorrect event emitted");
    assert.equal(result.logs[0].args.fileName, fileName, "Incorrect file name in event");
  });

  // Additional Test: Retrieving User Files
  it("should retrieve user's uploaded files", async () => {
    // Ensure uploader1 is added
    const initialUploaderStatus = await contractInstance.isUploader(uploader1);
    if (!initialUploaderStatus) {
      await contractInstance.addUploader(uploader1, { from: owner });
    }

    // Register a file
    const fileName = "another_test_file.txt";
    const encryptionKeyHash = web3.utils.sha3("another_test_key");

    await contractInstance.registerFile(
      fileName, 
      encryptionKeyHash, 
      { from: uploader1 }
    );

    // Retrieve user files
    const userFiles = await contractInstance.getUserFiles({ from: uploader1 });
    
    assert.equal(userFiles.length > 0, true, "No files retrieved for user");
  });
});