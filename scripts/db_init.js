const { Client } = require('pg');
const { readFileSync } = require('fs');
const dotenv = require('dotenv');
const currency_initial = require('../src/config/currency_initial');

const args = process.argv.slice(2) || '.env';

const envFile = args[0] === 'test' ? '.env.tests' : '.env';

dotenv.config({ path: envFile });

require('dotenv').config();

const caCert = readFileSync('/etc/ssl/cert.pem').toString();

const generateInsertSQL = () => {
    const values = Object.values(currency_initial)
        .map(({ currencyCode, currencyName, symbol }) => `('${currencyCode}', '${currencyName.replace("'", "''")}', '${symbol}')`)
        .join(',\n    ');
    return `
        INSERT INTO currencies (currencyCode, currencyName, symbol) VALUES
        ${values};
    `;
};

const _db = new Client({
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
    password: process.env.DB_PASS,
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    ssl: {
        rejectUnauthorized: false,
        cert: caCert,
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
        "createdAt" TIMESTAMP NOT NULL DEFAULTNOW(),
        "updatedAt" TIMESTAMP
    );
`;

const createRolesTableQuery = `
    CREATE TABLE roles (
        "roleId" SERIAL PRIMARY KEY,
        "roleType" INT UNIQUE NOT NULL
    );
`;
const createRolesTableDefaultValues = `INSERT INTO roles  ( "roleType"  ) VALUES ( 1 ), ( 2 )`;

const createUserRolesTableQuery = `
    CREATE TABLE userRoles (
        "userRoleId" SERIAL PRIMARY KEY,
        "roleId" INT NOT NULL,
        "userId" INT NOT NULL,
        FOREIGN KEY ("userId") REFERENCES users("userId"),
        FOREIGN KEY ("roleId") REFERENCES roles("roleId"),
        UNIQUE ("userId")
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
        "createdAt" TIMESTAMP NOT NULL DEFAULTNOW(),
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
        "createdAt" TIMESTAMP NOT NULL DEFAULTNOW(),
        "updatedAt" TIMESTAMP,
        UNIQUE ("userGroupId", "invitedEmail")
    );
`;

const createCurrencyTableQuery = `
    CREATE TABLE currencies (
        "currencyId" SERIAL PRIMARY KEY,
        "currencyCode" VARCHAR(56) UNIQUE NOT NULL,
        "currencyName" VARCHAR(56) UNIQUE NOT NULL,
        "symbol" VARCHAR(10) UNIQUE NOT NULL,
    );
`;

const insertDefaultCurrencies = generateInsertSQL();

const createProfileTableQuery = `
    CREATE TABLE profiles (
        "profileId" SERIAL PRIMARY KEY,
        "userId" INT UNIQUE NOT NULL,
        "userName" VARCHAR(50),
        "currencyId" INT,
        "mailConfirmed" BOOLEAN DEFAULT FALSE,
        "locale" VARCHAR(10),
        "additionalInfo" JSONB,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES users("userId") ON DELETE CASCADE,
        FOREIGN KEY ("currencyId") REFERENCES currencies("currencyId")
    );
`;

const createIncomeTableQuery = `
    CREATE TABLE incomes (
        "incomeId" SERIAL PRIMARY KEY,
        "userId" INT NOT NULL,
        "incomeName" VARCHAR(128) NOT NULL,
        "currencyId" INT NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        FOREIGN KEY ("userId") REFERENCES users("userId"),
        FOREIGN KEY ("currencyId") REFERENCES currencies("currencyId")
    );
`;

const createAccountTypeTableQuery = `
    CREATE TABLE "accountTypes" (
        "accountTypeId" SERIAL PRIMARY KEY,
        "accountType" INI NOT NULL,
    );
`;

const createAccountTypeTableDefaultValues = `INSERT INTO "accountTypes"  ( "accountType"  ) VALUES ( 1 ), ( 2 )`;

const createAccountTableQuery = `
    CREATE TABLE accounts (
        "accountId" SERIAL PRIMARY KEY,
        "userId" INT NOT NULL,
        "accountName" VARCHAR(128) NOT NULL,
        "accountTypeId" INT NOT NULL,
        "amount" DECIMAL NOT NULL,
        "currencyId" INT NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        FOREIGN KEY ("userId") REFERENCES users("userId"),
        FOREIGN KEY ("currencyId") REFERENCES currencies("currencyId")
        FOREIGN KEY ("accountTypeId") REFERENCES accountTypes("accountTypeId")
    );
`;

const createCategoriesTableQuery = `
    CREATE TABLE categories (
        "categoryId" SERIAL PRIMARY KEY,
        "categoryName" VARCHAR(128) NOT NULL,
        "userId" INT NOT NULL,
        "currencyId" INT NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
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
        "transactionTypeId" INT NOT NULL,
        "currencyId" INT NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updateAt" TIMESTAMP ,
        FOREIGN KEY ("transactionTypeId") REFERENCES "transactionTypes"("transactionTypeId"),
        FOREIGN KEY ("accountId") REFERENCES accounts("accountId"),
        FOREIGN KEY ("userId") REFERENCES users("userId"),
        FOREIGN KEY ("currencyId") REFERENCES currencies("currencyId"),
        FOREIGN KEY ("categoryId") REFERENCES categories("categoryId"),
        FOREIGN KEY ("incomeId") REFERENCS incomes("incomeId")
    );
`;

const createTransactionTypesTableQuery = `
    CREATE TABLE "transactionTypes" (
        "transactionTypeId" SERIAL PRIMARY KEY,
        "transactionType" VARCHAR(50) UNIQUE NOT NULL
    );
`;
const createTransactionTypesDefaultValues = `INSERT INTO "transactionTypes" ( "transactionType"  ) VALUES ( 'income' ), ( 'expense' ), ('transfer')`;

const createEmailConfirmationTableQuery = `
    CREATE TABLE email_confirmations (
        "confirmationId" SERIAL PRIMARY KEY,
        "userId" INT NOT NULL,
        "email" VARCHAR(100) NOT NULL,
        "confirmationCode" INT NOT NULL,
        "confirmed" BOOLEAN DEFAULT FALSE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "expiresAt" TIMESTAMP NOT NULL,
        FOREIGN KEY ("userId") REFERENCES users("userId") ON DELETE CASCADE,
        UNIQUE ("userId", "email")
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
            console.log(`OK: ${name}`);
        })
        .catch((err) => {
            console.error(`ERROR ${name} :`, err.stack);
        });
};
const run = async () => {
    await initTable(createUserTableQuery);
    await initTable(createRolesTableQuery);
    await initTable(createRolesTableDefaultValues);
    await initTable(createUserRolesTableQuery);
    await initTable(createUserGroupsTableQuery);
    await initTable(createGroupInvitationsTableQuery);
    await initTable(createCurrencyTableQuery);
    await initTable(insertDefaultCurrencies);
    await initTable(createProfileTableQuery);
    await initTable(createIncomeTableQuery);
    await initTable(createAccountTypeTableQuery);
    await initTable(createAccountTypeTableDefaultValues);
    await initTable(createAccountTableQuery);
    await initTable(createCategoriesTableQuery);
    await initTable(createTransactionTypesTableQuery);
    await initTable(createTransactionTypesDefaultValues);
    await initTable(createTransactionsTableQuery);
    await initTable(createEmailConfirmationTableQuery);
    _db.end();
};

_db.on('connect', (client) => {
    run();
});
