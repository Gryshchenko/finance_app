const { readFileSync } = require('fs');
require('dotenv').config({ path: './tests/.env' });

const caCert = readFileSync('/etc/ssl/cert.pem').toString();

const commonConfig = {
    client: 'pg',
    connection: {
        port: Number(process.env.DB_PORT),
        password: process.env.DB_PASS,
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        ssl: false,
        // ssl: {
        //     rejectUnauthorized: false,
        //     ca: caCert,
        // },
    },
    migrations: {
        tableName: 'knex_migrations',
    },
};

module.exports = {
    test: {
        ...commonConfig,
        connection: {
            ...commonConfig.connection,
        },
    },
};
