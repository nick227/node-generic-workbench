const mysql = require('mysql');
require('dotenv').config();
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT, 10),
});

connection.connect();

const tablesToCheck = [
  'user', 'project', 'job', 'payment_type', 'job_update', 'comment'
];

tablesToCheck.forEach(table => {
  connection.query(`DESCRIBE ${table}`, (error, results) => {
    if (error) {
      console.log(`Table ${table} does not exist.`);
    } else {
      console.log(`Table ${table} exists. Columns:`, results.map(column => column.Field).join(', '));
    }
  });
});

setTimeout(function(){
  connection.end();

}, 13333);