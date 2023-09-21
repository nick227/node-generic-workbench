const mysql = require('mysql');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const createTablesQueries = [
  `CREATE TABLE user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    telephone VARCHAR(20),
    city VARCHAR(255),
    facebook_url VARCHAR(255),
    instagram_url VARCHAR(255),
    youtube_url VARCHAR(255),
    homepage_url VARCHAR(255),
    discord_url VARCHAR(255),
    image VARCHAR(255),
    create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE project (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image VARCHAR(255),
    create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INT,
    crew TEXT,
    budget VARCHAR(255),
    type VARCHAR(255),
    location VARCHAR(255)
);

CREATE TABLE audio (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transcript TEXT,
  audio LONGBLOB,
  filename VARCHAR(255),
  create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- added comma here
  user_id INT
);

CREATE TABLE project_type (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image VARCHAR(255)
);

CREATE TABLE job (
    id INT AUTO_INCREMENT PRIMARY KEY,
    status VARCHAR(50),
    title VARCHAR(255),
    description TEXT,
    image VARCHAR(255),
    start_date VARCHAR(50),
    duration VARCHAR(50),
    type VARCHAR(255),
    public VARCHAR(50),
    project_id INT,
    payment VARCHAR(255),
    payment_amount VARCHAR(255),
    payment_description VARCHAR(255),
    payment_date VARCHAR(50),
    payment_type_id INT,
    payment_conditions VARCHAR(255),
    user_id INT,
    create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE invite (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- added comma here
  recipient_user_id INT,
  recipient_name VARCHAR(255),
  recipient_email VARCHAR(255)
);

CREATE TABLE payment_type (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT
);

CREATE TABLE job_type (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT
);

CREATE TABLE job_update (
    id INT AUTO_INCREMENT PRIMARY KEY,
    status VARCHAR(50),
    job_id INT,
    create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    creator_user_id INT,
    text TEXT NOT NULL,
    entity_type VARCHAR(50) CHECK (entity_type IN ('job', 'project')),
    entity_id INT
);`
];


const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT, 10),
  multipleStatements: true
});

console.log(process.env.DB_NAME);

function queryAsync(sql, params) {
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (error, results) => {
      if (error) return reject(error);
      resolve(results);
    });
  });
}


async function removeAllTables() {
  try {
    await queryAsync('SET FOREIGN_KEY_CHECKS = 0;');
    const results = await queryAsync("SELECT GROUP_CONCAT(table_name SEPARATOR ',') AS tables FROM information_schema.tables WHERE table_schema = ?", [process.env.DB_NAME]);
    const tables = results[0].tables;
    if (tables) {
      await queryAsync(`DROP TABLE ${tables};`);
    }
    await queryAsync('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('All tables deleted successfully.');
  } catch (error) {
    console.error('Error removing tables:', error.message);
    connection.end();  // Terminate the connection if there's an error
  }
}

async function createTables() {
  for (const query of createTablesQueries) {
    try {
      await queryAsync(query);
      console.log('Table created successfully');
    } catch (error) {
      console.error(`Error creating table: ${error.message}`);
    }
  }
}

// Main script flow
async function main() {
  try {
    await removeAllTables();
    await createTables();
  } catch (error) {
    console.error('Error in main script:', error.message);
  } finally {
    connection.end();
  }
}

main();