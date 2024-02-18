const { Client } = require('pg');
const { readFileSync } = require('fs');
require('dotenv').config();

const caCert = readFileSync('./eu-central-1-bundle.pem').toString();

const _db = new Client({
    database: null,
    port: Number(process.env.DB_PORT),
    password: process.env.DB_PASS,
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    ssl: {
        rejectUnauthorized: false,
        ca: caCert,
    },
});
_db.connect();

const createUserTableQuery = `
    CREATE TABLE users (
        "userId" SERIAL PRIMARY KEY,
        "userName" VARCHAR(50) NOT NULL,
        "email" VARCHAR(100) UNIQUE NOT NULL,
        "passwordHash" VARCHAR(256) NOT NULL,
        "salt" VARCHAR(256) NOT NULL, 
        status INT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP
    );
`;

const createRolesTableQuery = `
    CREATE TABLE roles (
        "roleId" SERIAL PRIMARY KEY,
        "roleType" INT UNIQUE NOT NULL
    );
`;

const createUserRolesTableQuery = `
    CREATE TABLE userRoles (
        "userId" INT,
        "roleId" INT,
        PRIMARY KEY ("userId", "roleId"),
        FOREIGN KEY ("userId") REFERENCES users("userId"),
        FOREIGN KEY ("roleId") REFERENCES roles("roleId"),
        UNIQUE ("userId", "roleId")
    );
`;

const createUserGroupsTableQuery = `
    CREATE TABLE userGroups (
        "userGroupId" SERIAL PRIMARY KEY,
        "userId" INT,
        "groupRole" INT,
        "groupName" varchar(128),
        UNIQUE ("userId", "userGroupId"),
        FOREIGN KEY ("userId") REFERENCES users("userId"),
        "createdAt" TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP
    );
`;

const createGroupInvitationsTableQuery = `
    CREATE TABLE groupInvitations (
        "invitationId" SERIAL PRIMARY KEY,
        "userGroupId" INT,
        "invitedEmail" varchar(128),
        "status" INT,
        FOREIGN KEY ("userGroupId") REFERENCES userGroups("userGroupId"),
        "createdAt" TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP,
        UNIQUE ("userGroupId", "invitedEmail")
    );
`;

const createCurrencyTableQuery = `
    CREATE TABLE currencies (
        "currencyId" SERIAL PRIMARY KEY,
        "currencyCode" VARCHAR(56) UNIQUE NOT NULL,
        "currencyName" VARCHAR(56) UNIQUE NOT NULL 
    );
`;

const createIncomeTableQuery = `
    CREATE TABLE incomes (
        "incomeId" SERIAL PRIMARY KEY,
        "userId" INT NOT NULL,
        "incomeName" VARCHAR(128) NOT NULL,
        "amount" DECIMAL NOT NULL,
        "currencyId" INT NOT NULL,
        "createdAt" TIMESTAMP NOT NULL,
        FOREIGN KEY ("userId") REFERENCES users("userId"),
        FOREIGN KEY ("currencyId") REFERENCES currencies("currencyId")
    );
`;

const createAccountTableQuery = `
    CREATE TABLE accounts (
        "accountId" SERIAL PRIMARY KEY,
        "userId" INT NOT NULL,
        "accountName" VARCHAR(128) NOT NULL,
        "amount" DECIMAL NOT NULL,
        "currencyId" INT NOT NULL,
        "createdAt" TIMESTAMP NOT NULL,
        FOREIGN KEY ("userId") REFERENCES users("userId"),
        FOREIGN KEY ("currencyId") REFERENCES currencies("currencyId")
    );
`;

const createCategoriesTableQuery = `
    CREATE TABLE categories (
        "categoryId" SERIAL PRIMARY KEY,
        "categoryName" VARCHAR(128) NOT NULL,
        "userId" INT NOT NULL,
        "currencyId" INT NOT NULL,
        "accountId" INT NOT NULL,
        "createdAt" TIMESTAMP NOT NULL,
        FOREIGN KEY ("accountId") REFERENCES accounts("accountId"),
        FOREIGN KEY ("userId") REFERENCES users("userId"),
        FOREIGN KEY ("currencyId") REFERENCES currencies("currencyId")
    );
`;

const createTransactionsTableQuery = `
    CREATE TABLE transactions (
        "transactionId" SERIAL PRIMARY KEY,
        "userId" INT NOT NULL,
        "categoryId" INT,
        "accountId" INT,
        "incomeId" INT,
        "amount" DECIMAL NOT NULL,
        "description" VARCHAR(256),
        "currencyId" INT NOT NULL,
        "createdAt" TIMESTAMP NOT NULL,
        FOREIGN KEY ("accountId") REFERENCES accounts("accountId"),
        FOREIGN KEY ("userId") REFERENCES users("userId"),
        FOREIGN KEY ("currencyId") REFERENCES currencies("currencyId"),
        FOREIGN KEY ("categoryId") REFERENCES categories("categoryId"),
        FOREIGN KEY ("incomeId") REFERENCES incomes("incomeId")
    );
`;

const initTable = (query) => {
    const match = query.match(/CREATE TABLE (\w+)/i);
    if (!match) {
        console.error('Cant find name');
        return;
    }
    const name = match[1];
    return _db
        .query(query)
        .then((res) => {
            console.log('OK: ' + name);
        })
        .catch((err) => {
            console.error(`ERROR ${name} :`, err.stack);
        });
};
const run = async () => {
    await initTable(createUserTableQuery);
    await initTable(createRolesTableQuery);
    await initTable(createUserRolesTableQuery);
    await initTable(createUserGroupsTableQuery);
    await initTable(createGroupInvitationsTableQuery);
    await initTable(createCurrencyTableQuery);
    await initTable(createIncomeTableQuery);
    await initTable(createAccountTableQuery);
    await initTable(createCategoriesTableQuery);
    await initTable(createTransactionsTableQuery);
    _db.end();
};

_db.on('connect', (client) => {
    run();
});
