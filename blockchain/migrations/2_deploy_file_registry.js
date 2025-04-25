const FileEncryptionRegistry = artifacts.require("FileEncryptionRegistry");

module.exports = function(deployer) {
  deployer.deploy(FileEncryptionRegistry);
};