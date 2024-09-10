const mysql = require('mysql');
// Connection DB
const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "event"
});

module.exports = con;
