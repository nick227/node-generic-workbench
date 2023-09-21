require('dotenv').config();
const mysql = require('mysql');

const pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT, 10)
});

const getConnection = () => new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
        if (err) reject(err);
        resolve(connection);
    });
});

const executeQuery = async (query, values = []) => {
    const connection = await getConnection();
    return new Promise((resolve, reject) => {
        connection.query(query, values, (error, results) => {
            connection.release();
            if (error) reject(error);
            resolve(results);
        });
    });
};

const bcrypt = require('bcrypt');
const saltRounds = 10;
const USERS_TABLE = 'user';

module.exports = {
    async findUserById(id) {
        try {
            const rows = await executeQuery(`SELECT * FROM ${USERS_TABLE} WHERE id = ?`, [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    },

    async checkIfEmailExists(email) {
        try {
            const rows = await executeQuery(`SELECT * FROM ${USERS_TABLE} WHERE email = ?`, [email]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    },

    async createUser(email, password) {
        try {
            const hash = await bcrypt.hash(password, saltRounds);
            const results = await executeQuery(`INSERT INTO ${USERS_TABLE} (email, password) VALUES (?, ?)`, [email, hash]);
            return results.insertId; 
        } catch (error) {
            throw error;
        }
    },

    async findUserByEmail(email, inputPassword) {
        try {
            const rows = await executeQuery(`SELECT * FROM ${USERS_TABLE} WHERE email = ?`, [email]);
            if (rows.length > 0) {
                const isPasswordValid = await bcrypt.compare(inputPassword, rows[0].password);
                if (isPasswordValid) {
                    return rows[0];
                }
            }
            return null;
        } catch (error) {
            throw error;
        }
    }
};
