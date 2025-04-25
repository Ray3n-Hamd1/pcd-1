const sql = require("mssql");

// Database configuration
const config = {
  user: "RayenHamdi",
  password: "Rayen97375176",
  server: "secure.database.windows.net",
  database: "SecureSafe",
  options: {
    encrypt: true, // For Azure databases
    enableArithAbort: true,
    trustServerCertificate: false,
    connectionTimeout: 30000, // 30 seconds
    requestTimeout: 30000 // 30 seconds
  },
  pool: {
    max: 10, // Maximum number of connections in the pool
    min: 0, // Minimum number of connections in the pool
    idleTimeoutMillis: 30000 // How long a connection is idle before being closed
  }
};

// Create a connection pool
const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log("Connected to Azure SQL Database");
    return pool;
  })
  .catch(err => {
    console.error("Database Connection Failed! Bad Config: ", err);
    throw err;
  });

// Export the SQL library and connection pool
module.exports = {
  sql, 
  poolPromise,
  // Helper function to execute queries with better error handling
  async executeQuery(query, inputs = {}) {
    try {
      const pool = await poolPromise;
      const request = pool.request();
      
      // Add all inputs to the request
      Object.entries(inputs).forEach(([key, value]) => {
        // Determine SQL type based on JavaScript type
        let sqlType;
        switch (typeof value) {
          case 'number':
            if (Number.isInteger(value)) {
              sqlType = sql.Int;
            } else {
              sqlType = sql.Float;
            }
            break;
          case 'boolean':
            sqlType = sql.Bit;
            break;
          case 'string':
            if (value.length > 8000) {
              sqlType = sql.NVarChar(sql.MAX);
            } else {
              sqlType = sql.NVarChar(value.length || 1);
            }
            break;
          case 'object':
            if (value instanceof Date) {
              sqlType = sql.DateTime;
            } else if (value === null) {
              // Handle null values - default to NVarChar
              sqlType = sql.NVarChar;
              value = null;
            } else {
              // Convert objects to JSON strings
              sqlType = sql.NVarChar(sql.MAX);
              value = JSON.stringify(value);
            }
            break;
          default:
            sqlType = sql.NVarChar;
        }
        
        request.input(key, sqlType, value);
      });
      
      // Execute the query
      const result = await request.query(query);
      return result;
    } catch (error) {
      console.error(`Query execution error: ${error.message}`);
      throw error;
    }
  }
};