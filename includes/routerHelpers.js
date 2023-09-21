
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
const tables = require('./tables');
const appName = require('./appName');

const fs = require('fs');
const path = require('path');
const util = require('util');
const { log } = require('util');

async function uploadImage(formData) {
    try {
        // Check if a file was uploaded
        if (!formData) {
            return null;
        }

        // Generate a unique filename (you can use a library like `uuid` for this)
        const uniqueFilename = generateUniqueFilename();
        
        // Define the path where the file will be saved on the server
        const uploadPath = path.join(__dirname, '..', 'public', 'uploads', uniqueFilename);

        // Write the file to the server
        await fs.promises.writeFile(uploadPath, formData.buffer);

        // Return the filename for storage in the database
        return uniqueFilename;
    } catch (error) {
        throw error;
    }
}

const getTableNameFromRequest = (req) => {
    const parts = req.path.split('/').filter(val => val);
    const index = parts[0] === 'api' ? parts.length-1 : 0;
    const path = parts[index];
    return path;
};

const verifyTableName = tableName => {
    if (!tables.includes(tableName)) {
        throw new Error("Invalid table name");
    }
    return tableName;
};

const buildWhereClause = (params) => {
    const clauses = [];
    for (let key in params) {
        clauses.push(`${key} = ${mysql.escape(params[key])}`);
    }
    return clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';
};

function generateUniqueFilename() {
    const timestamp = Date.now();
    return `image_${timestamp}.png`;
}

const getBlankRowWithColumnNames = async (tableName) => {
    // Fetch column names for the table
    const columns = await executeQuery(`SELECT COLUMN_NAME 
                                        FROM INFORMATION_SCHEMA.COLUMNS 
                                        WHERE TABLE_NAME = ?`, 
                                        [tableName]);

    // Create a blank row with column names as keys and null as values
    const blankRow = columns.reduce((acc, column) => {
        acc[column.COLUMN_NAME] = null;
        return acc;
    }, {});

    return blankRow;
};

const getConnection = () => new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
        if (err) reject(err);
        resolve(connection);
    });
});

const executeQuery = async (query, values = []) => {
    try {
        const connection = await getConnection();
        const queryAsync = util.promisify(connection.query).bind(connection);
        // Execute the query with error handling
        
        const results = await queryAsync(query, values).catch(error => {
            throw error; // Re-throw the error to be caught by the outer catch block
        });


        connection.release();
        return { data: results, error: null };
    } catch (error) {
        // Properly handle any errors that occur during connection or query execution
        connection.release();
        return { data: null, error };
    }
};

const addNewRowAndGet = async (tableName, req) => {
    
    const data = req.body;
    const file = req.file;
    
    try {
        let imageUrl = null;

        if (file) {
            imageUrl = await uploadImage(file);
            data.image = imageUrl;
        }

        if(req.user) {
            data.user_id = req.user.id;
        }

        
        const queryResult = await executeQuery(`INSERT INTO ${tableName} SET ?`, [data]);
        
        if (queryResult.error) {
            throw queryResult.error;
        }

        const insertId = queryResult.data.insertId;

        return insertId; // Return the insertId, not the whole data object
    } catch (error) {
        throw error;
    }
};

const renderResults = async (res, data, template, tableName) => {
    if (template) {
        res.render(template, { results: data.data, tableName: tableName, tables: tables, appName: appName, template: template });
    } else {
        if (typeof data === 'object' && data !== null) {
            res.json(data);
        } else {
            res.status(200); // Set the status code
            //res.send(data);  // Send the data        }
        }
    }
};


module.exports = {
    getTableNameFromRequest:getTableNameFromRequest,
    verifyTableName:verifyTableName,
    buildWhereClause:buildWhereClause,
    getConnection:getConnection,
    getBlankRowWithColumnNames:getBlankRowWithColumnNames,
    executeQuery:executeQuery,
    addNewRowAndGet:addNewRowAndGet,
    renderResults:renderResults
};