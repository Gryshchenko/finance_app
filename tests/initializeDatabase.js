const { Client } = require('pg');
const { test } = require('./knexfile');

const dbConfig = test.connection;

const dbName = test.connection.database;

const createDatabase = async (client, database) => {
    try {
        await client.query(`CREATE DATABASE ${database}`);
        console.log(`Database ${database} created successfully.`);
    } catch (err) {
        console.error(`Error creating database ${database}:`, err);
    }
};

const dropDatabase = async (client, database) => {
    try {
        await client.query(`DROP DATABASE IF EXISTS ${database}`);
        console.log(`Database ${database} dropped successfully.`);
    } catch (err) {
        console.error(`Error dropping database ${database}:`, err);
    }
};

const createUser = async (client, user, password) => {
    try {
        await client.query(`CREATE USER ${user} WITH PASSWORD '${password}'`);
        console.log(`User ${user} created successfully.`);
    } catch (err) {
        console.error(`Error creating user ${user}:`, err);
    }
};

const grantPrivileges = async (client, database, user) => {
    try {
        await client.query(`GRANT ALL PRIVILEGES ON DATABASE ${database} TO ${user}`);
        console.log(`Privileges granted to user ${user} on database ${database}.`);
    } catch (err) {
        console.error(`Error granting privileges to user ${user} on database ${database}:`, err);
    }
};

const initializeDatabase = async () => {
    const client = new Client(dbConfig);

    try {
        await client.connect();

        // Create user
        await createUser(client, dbConfig.user, dbConfig.password);

        // Drop and create database
        await dropDatabase(client, dbName);
        await createDatabase(client, dbName);

        // Grant privileges
        await grantPrivileges(client, dbName, dbConfig.user);
    } catch (err) {
        console.error('Error initializing database:', err);
    } finally {
        await client.end();
    }
};

initializeDatabase().catch((err) => console.error('Error initializing databases:', err));
