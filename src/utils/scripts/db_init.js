const { Client } = require('pg');
const dbConfig = require('../../config/dbConfig');
require('dotenv').config();

const _db = new Client({
    database: dbConfig.database,
    port: dbConfig.port,
    password: dbConfig.password,
    user: dbConfig.user,
    host: dbConfig.host,
    ssl: {
        rejectUnauthorized: false,
        cert: dbConfig.cert,
    },
});
_db.connect();

const createUserTableQuery = `
    CREATE TABLE users (
        "userId" SERIAL PRIMARY KEY,
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
        "userId" INT NOT NULL,
        "groupRole" INT,
        "groupName" varchar(128) NOT NULL,
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

const createCurrencyTypeTableQuery = `
    CREATE TABLE currencyType (
        "currencyTypeId" SERIAL PRIMARY KEY,
        "currencyType" INT NOT NULL,
        "currencyTypeName" VARCHAR(56) UNIQUE NOT NULL
    );
`;

const createCurrencyTableQuery = `
    CREATE TABLE currencies (
        "currencyId" SERIAL PRIMARY KEY,
        "currencyCode" VARCHAR(56) UNIQUE NOT NULL,
        "currencyName" VARCHAR(56) UNIQUE NOT NULL,
        "currencyTypeId" INT NOT NULL,
        FOREIGN KEY ("currencyTypeId") REFERENCES currencyType("currencyTypeId")
    );
`;

const createProfileTableQuery = `
    CREATE TABLE profiles (
        profileId SERIAL PRIMARY KEY,
        userId INT UNIQUE NOT NULL,
        userName VARCHAR(50),
        currencyId INT,
        additionalInfo JSONB,
        createdAt TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE,
        FOREIGN KEY ("currencyId") REFERENCES currencies("currencyId")
    );
`;

const createIncomeTableQuery = `
    CREATE TABLE incomes (
        "incomeId" SERIAL PRIMARY KEY,
        "userId" INT NOT NULL,
        "incomeName" VARCHAR(128) NOT NULL,
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

const createEmailConfirmationTableQuery = `
    CREATE TABLE email_confirmations (
        "confirmationId" SERIAL PRIMARY KEY,
        "userId" INT NOT NULL,
        "email" VARCHAR(100) NOT NULL,
        "confirmationCode" VARCHAR(255) NOT NULL,
        "confirmed" BOOLEAN DEFAULT FALSE,
        "createdAt" TIMESTAMP NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        FOREIGN KEY ("userId") REFERENCES users("userId") ON DELETE CASCADE
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
    await initTable(createCurrencyTypeTableQuery);
    await initTable(createCurrencyTableQuery);
    await initTable(createProfileTableQuery);
    await initTable(createIncomeTableQuery);
    await initTable(createAccountTableQuery);
    await initTable(createCategoriesTableQuery);
    await initTable(createTransactionsTableQuery);
    await initTable(createEmailConfirmationTableQuery);
    _db.end();
};

_db.on('connect', (client) => {
    run();
});