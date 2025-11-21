const databaseService = require('./services/databaseService');

// Wrapper pour maintenir la compatibilité avec l'ancienne interface de callback
module.exports = {
    all: (sql, params, callback) => {
        try {
            const rows = databaseService.all(sql, params);
            if (callback) callback(null, rows);
            return rows;
        } catch (err) {
            if (callback) callback(err);
            else throw err;
        }
    },
    get: (sql, params, callback) => {
        try {
            const row = databaseService.get(sql, params);
            if (callback) callback(null, row);
            return row;
        } catch (err) {
            if (callback) callback(err);
            else throw err;
        }
    },
    run: (sql, params, callback) => {
        try {
            const result = databaseService.run(sql, params);
            if (callback) callback.call({ lastID: result.lastInsertRowid, changes: result.changes }, null);
            return result;
        } catch (err) {
            if (callback) callback(err);
            else throw err;
        }
    },
    exec: (sql, callback) => {
        try {
            databaseService.exec(sql);
            if (callback) callback(null);
        } catch (err) {
            if (callback) callback(err);
            else throw err;
        }
    }
};
