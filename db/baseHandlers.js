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
const appName = require('./app');

const getTableNameFromRequest = req => req.path.split('/')[1];

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

const getConnection = () => new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
        if (err) reject(err);
        resolve(connection);
    });
});

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

const addNewRowAndGet = async (tableName, data) => {
    try {
        // Insert the new row
        const insertResults = await executeQuery(`INSERT INTO ${tableName} SET ?`, [data]);

        // Fetch the newly inserted row using the insertId
        const rowResults = await executeQuery(`SELECT * FROM ${tableName} WHERE id = ?`, [insertResults.insertId]);

        // Return the first (and only) item from the result set, which is the newly inserted row
        return rowResults[0];
    } catch (error) {
        throw error;
    }
};

const renderResults = async (res, data, template, tableName) => {
    if (template) {
        res.render(template, { results: data, tableName: tableName, tables: tables, appName: appName });
    } else {
        if (typeof data === 'object' && data !== null) {
            res.json(data);
        } else {
            res.send(data);
        }
    }
}

const baseHandlers = {
    add: async (req, res) => {
        try {
            let tableName = verifyTableName(getTableNameFromRequest(req));
            const results = await addNewRowAndGet(tableName, req.body);
            renderResults(res, results, req.ejsTemplate, tableName);
        } catch (error) {
            res.status(500).send(error.message);
        }
    },
    getAll: async (req, res) => {
        try {
            let tableName = verifyTableName(getTableNameFromRequest(req));
            const whereClause = buildWhereClause(req.query);
            const results = await executeQuery(`SELECT * FROM ${tableName}${whereClause}`);
            if (results.length === 0) {
                const blankRow = await getBlankRowWithColumnNames(tableName);
                results.push(blankRow);
            }
            renderResults(res, results, req.ejsTemplate, tableName);
        } catch (error) {
            res.status(500).send(error.message);
        }
    },
    getById: async (req, res) => {
        try {
            let tableName = verifyTableName(getTableNameFromRequest(req));
            const results = await executeQuery(`SELECT * FROM ${tableName} WHERE id = ?`, [req.params.id]);
            //res.render(req.ejsTemplate, results[0] || {});
            renderResults(res, results[0] || {}, req.ejsTemplate, tableName);
        } catch (error) {
            res.status(500).send(error.message);
        }
    },
    update: async (req, res) => {
        try {
            let tableName = verifyTableName(getTableNameFromRequest(req));
            await executeQuery(`UPDATE ${tableName} SET ? WHERE id = ?`, [req.body, req.params.id]);
            //res.render(req.ejsTemplate, { title: "Entry Updated", message: `Updated entry with ID: ${req.params.id}` });
            renderResults(res, req.params.id, req.ejsTemplate, tableName);
        } catch (error) {
            res.status(500).send(error.message);
        }
    },
    delete: async (req, res) => {
        try {
            let tableName = verifyTableName(getTableNameFromRequest(req));
            await executeQuery(`DELETE FROM ${tableName} WHERE id = ?`, [req.params.id]);
            //res.render(req.ejsTemplate, { title: "Entry Deleted", message: `Deleted entry with ID: ${req.params.id}` });
            renderResults(res, req.params.id, req.ejsTemplate, tableName);
        } catch (error) {
            res.status(500).send(error.message);
        }
    }
};

const handlers = {};
tables.forEach(table => handlers[table] = baseHandlers);

module.exports = handlers;
