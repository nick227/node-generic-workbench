const tables = require('./tables');
const tableColumnsFilter = require('./tableColumnsFilter');
const appName = require('./appName');
const {
    getTableNameFromRequest,
    verifyTableName,
    buildWhereClause,
    getBlankRowWithColumnNames,
    executeQuery,
    addNewRowAndGet,
    renderResults
} = require('./routerHelpers');

const baseHandlers = {
    template: (req, res) => {
        let tableName = verifyTableName(getTableNameFromRequest(req));
        renderResults(res, req, req.ejsTemplate, tableName);
    },
    add: async (req, res) => {
        try {
            let tableName = verifyTableName(getTableNameFromRequest(req));
            const results = await addNewRowAndGet(tableName, req);
            renderResults(res, results, req.ejsTemplate, tableName);
        } catch (error) {
            res.status(500).send(error.message);
        }
    },
    getAll: async (req, res) => {
        try {
            let tableName = verifyTableName(getTableNameFromRequest(req));
            const whereClause = buildWhereClause(req.query);
            const query = `SELECT ${tableColumnsFilter[tableName] || '*'} FROM ${tableName} ${whereClause}`;
            const results = await executeQuery(query);

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
            renderResults(res, results, req.ejsTemplate, tableName);
        } catch (error) {
            res.status(500).send(error.message);
        }
    },
    update: async (req, res) => {
        try {
            let tableName = verifyTableName(getTableNameFromRequest(req));
            await executeQuery(`UPDATE ${tableName} SET ? WHERE id = ?`, [req.body, req.params.id]);
            renderResults(res, req.params.id, req.ejsTemplate, tableName);
        } catch (error) {
            res.status(500).send(error.message);
        }
    },
    delete: async (req, res) => {
        try {
            let tableName = verifyTableName(getTableNameFromRequest(req));
            await executeQuery(`DELETE FROM ${tableName} WHERE id = ?`, [req.params.id]);
            renderResults(res, req.params.id, req.ejsTemplate, tableName);
        } catch (error) {
            res.status(500).send(error.message);
        }
    }
};

const handlers = {};
tables.forEach(table => handlers[table] = baseHandlers);

module.exports = handlers;
