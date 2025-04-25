module.exports = {
    networks: {
      development: {
        host: "127.0.0.1",     // Ganache host
        port: 7545,             // Ganache port
        network_id: 5777,       // Ganache network ID (make sure this matches Ganache)
        gas: 6721975,           // Ganache default gas limit
        gasPrice: 20000000000   // Ganache default gas price
      }
    },
    
    compilers: {
      solc: {
        version: "0.8.0",      // Specify the exact version
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
    }
  };