// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FileEncryptionRegistry {
    // Structs
    struct FileMetadata {
        address uploader;
        uint256 uploadTimestamp;
        string fileName;
        string encryptionKey;
        bool isActive;
    }

    struct UserProfile {
        bool isUploader;
        uint256 totalFilesUploaded;
    }

    // State Variables
    address public owner;
    mapping(address => UserProfile) public userProfiles;
    mapping(bytes32 => FileMetadata) private fileRegistry;
    mapping(address => bytes32[]) private userFiles;
    uint256 public totalFiles;

    // Reentrancy guard
    bool private locked;

    // Events
    event OwnershipTransferred(
        address indexed previousOwner, 
        address indexed newOwner
    );
    event UploaderAdded(address indexed uploader);
    event UploaderRemoved(address indexed uploader);
    event FileRegistered(
        bytes32 indexed fileId, 
        address indexed uploader, 
        string fileName,
        string encryptionKey
    );
    event FileArchived(bytes32 indexed fileId);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized: Owner only");
        _;
    }

    modifier onlyUploader() {
        require(
            userProfiles[msg.sender].isUploader, 
            "Not authorized: Uploader only"
        );
        _;
    }

    // Corrected reentrancy guard modifier
    modifier noReentrant() {
        require(!locked, "Reentrant call");
        locked = true;
        _;
        locked = false;
    }

    // Constructor
    constructor() {
        owner = msg.sender;
        userProfiles[msg.sender] = UserProfile({
            isUploader: true,
            totalFilesUploaded: 0
        });
    }

    // Owner Functions
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Invalid new owner address");
        
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function addUploader(address uploaderAddress) public onlyOwner {
        require(
            !userProfiles[uploaderAddress].isUploader, 
            "Address is already an uploader"
        );

        userProfiles[uploaderAddress].isUploader = true;
        emit UploaderAdded(uploaderAddress);
    }

    function removeUploader(address uploaderAddress) public onlyOwner {
        require(
            userProfiles[uploaderAddress].isUploader, 
            "Address is not an uploader"
        );

        userProfiles[uploaderAddress].isUploader = false;
        emit UploaderRemoved(uploaderAddress);
    }

    // File Management Functions
    function registerFile(
        string memory _fileName,
        string memory _encryptionKey
    ) public onlyUploader noReentrant returns (bytes32) {
        // Validate key length
        require(bytes(_encryptionKey).length >= 16 && bytes(_encryptionKey).length <= 512, "Invalid key length");

        // Generate unique file identifier
        bytes32 fileId = keccak256(abi.encodePacked(
            _fileName, 
            msg.sender, 
            block.timestamp,
            totalFiles
        ));

        // Create file metadata
        fileRegistry[fileId] = FileMetadata({
            uploader: msg.sender,
            uploadTimestamp: block.timestamp,
            fileName: _fileName,
            encryptionKey: _encryptionKey,
            isActive: true
        });

        // Track user's files
        userFiles[msg.sender].push(fileId);

        // Increment total files and user's file count
        totalFiles++;
        userProfiles[msg.sender].totalFilesUploaded++;

        // Emit event with the encryption key
        emit FileRegistered(fileId, msg.sender, _fileName, _encryptionKey);

        return fileId;
    }

    function archiveFile(bytes32 _fileId) public {
        FileMetadata storage file = fileRegistry[_fileId];
        
        // Only file uploader or owner can archive
        require(
            msg.sender == file.uploader || msg.sender == owner, 
            "Not authorized to archive"
        );
        require(file.isActive, "File already archived");

        file.isActive = false;
        emit FileArchived(_fileId);
    }

    // View Functions
    function getFileMetadata(bytes32 _fileId) 
        public 
        view 
        returns (FileMetadata memory) 
    {
        require(fileRegistry[_fileId].isActive, "File not found");
        return fileRegistry[_fileId];
    }

    function getUserFiles() public view returns (bytes32[] memory) {
        return userFiles[msg.sender];
    }

    function isUploader(address _address) public view returns (bool) {
        return userProfiles[_address].isUploader;
    }
    function getEncryptionKey(bytes32 _fileId) public view returns (string memory) {
    require(fileRegistry[_fileId].isActive, "File not found");
    return fileRegistry[_fileId].encryptionKey;
}
}