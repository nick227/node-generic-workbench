
const tables = require('./db/tables');
const handlers = require('./db/baseHandlers');

const generateRoutesForTable = (tableName) => {
    return [
        { method: 'post', path: `/${tableName}`, handler: `${tableName}.add`, ejsTemplate: '' },
        { method: 'get', path: `/${tableName}`, handler: `${tableName}.getAll`, ejsTemplate: 'list' },
        { method: 'get', path: `/${tableName}/:id`, handler: `${tableName}.getById`, ejsTemplate: 'item' },
        { method: 'put', path: `/${tableName}/:id`, handler: `${tableName}.update`, ejsTemplate: '' },
        { method: 'delete', path: `/${tableName}/:id`, handler: `${tableName}.delete`, ejsTemplate: '' },
    ];
}

const routes = tables.flatMap(generateRoutesForTable);

module.exports = {
    routes: routes,
    handlers: handlers
};