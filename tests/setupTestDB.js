const { exec } = require('child_process');
const { Client } = require('pg');
const { test } = require('./knexfile');

const client = new Client(test.connection);

const setupTestDB = async () => {
    await client.connect();
    await client.query(`CREATE DATABASE ${test.connection.database}`);
    console.log(`Test database ${test.connection.database} created`);
    await client.end();
};

const teardownTestDB = async () => {
    await client.connect();
    await client.query(`DROP DATABASE IF EXISTS ${test.connection.database}`);
    console.log(`Test database ${test.connection.database} dropped`);
    await client.end();
};

if (process.argv[2] === 'setup') {
    setupTestDB();
} else if (process.argv[2] === 'teardown') {
    teardownTestDB();
}
