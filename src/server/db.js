const sql = require("mssql");

const config = {
  user: "RayenHamdi",
  password: "Rayen97375176",
  server: "secure.database.windows.net",
  database: "SecureSafe",
  options: {
    encrypt: true,
    enableArithAbort: true,
  },
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log("Connected to Azure SQL");
    return pool;
  })
  .catch(err => {
    console.error("DB Connection Failed!", err);
    throw err;
  });

module.exports = { sql, poolPromise };
