# SecureSafe - Secure Document Vault

SecureSafe is a decentralized application (dApp) designed to securely store and manage your encrypted documents. Our platform ensures confidentiality, integrity, and accessibility of your files by leveraging encryption, blockchain technology, and cloud storage integration.
## Features

- Confidentiality through encryption of your files before upload
- Integrity by storing encryption keys on a secure blockchain network
- Accessibility with seamless cloud storage integration
- User roles and permissions management (SuperAdmin, Admin, User)
- Departmental and sub-departmental file organization
- File access logging and auditing

## Technologies Used

- Frontend: React, Vite, HTML, CSS
- Backend: Node.js, Express.js
- Database: Microsoft SQL Server, Azure SQL Database
- Blockchain: Ethereum, Solidity, Ganache, Truffle
- Cloud Storage: Azure Blob Storage
- Encryption: Web Crypto API, AES-GCM

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Microsoft SQL Server (or Azure SQL Database)
- Azure Storage Account
- Ganache (for local Ethereum blockchain)
- Truffle (for Solidity contract compilation and deployment)
- MetaMask browser extension (for interacting with the Ethereum blockchain)
- ### Installation

1. Clone the repository:
git clone https://github.com/Ray3n-Hamd1/pcd-1.git
2. Navigate to the project directory
3. Install the dependencies
4. Set up the environment variables:
- Create a `.env` file in the root directory
- Provide the necessary environment variables (database connection, Azure storage credentials, etc.)

5. Set up the database:
- Create a new database in Microsoft SQL Server or Azure SQL Database
- Run the database migration scripts to set up the required tables

6. Set up the blockchain:
- Start Ganache to run a local Ethereum blockchain
- Compile and deploy the Solidity contract using Truffle

7. Start the development server:npm run dev
8. Open your browser and visit `http://localhost:5173` to access the application.

## Folder Structure

- `src/`: Contains the main source code of the application
- `Components/`: React components used in the frontend
- `server/`: Backend server code and routes
- `services/`: Service classes for interacting with the blockchain and other external services
- `utils/`: Utility functions used throughout the application
- `blockchain/`: Contains Solidity contract code and Truffle configuration
- `public/`: Public assets and index.html file
- `README.md`: Project documentation
