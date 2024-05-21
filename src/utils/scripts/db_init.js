const { Client } = require('pg');
const { readFileSync } = require('fs');
const dotenv = require('dotenv');

const args = process.argv.slice(2) || '.env';

const envFile = args[0] === 'test' ? '.env.tests' : '.env';

dotenv.config({ path: envFile });

require('dotenv').config();

const caCert = readFileSync('/etc/ssl/cert.pem').toString();

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
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
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

const insertDefaultCurrencies = `
    INSERT INTO currencies (currencyCode, currencyName, symbol) VALUES
    ('DKK', 'Danish Krone', 'kr'),
    ('EUR', 'Euro', '€'),
    ('USD', 'US Dollar', '$'),
    ('NOK', 'Norwegian Krone', 'kr'),
    ('UAH', 'Ukrainian Hryvnia', '₴'),
    ('RUB', 'Russian Ruble', '₽'),
    ('BGN', 'Bulgarian Lev', 'лв'),
    ('CZK', 'Czech Koruna', 'Kč'),
    ('HRK', 'Croatian Kuna', 'kn'),
    ('HUF', 'Hungarian Forint', 'Ft'),
    ('JPY', 'Japanese Yen', '¥'),
    ('GEL', 'Georgian Lari', '₾'),
    ('PLN', 'Polish Zloty', 'zł'),
    ('BRL', 'Brazilian Real', 'R$'),
    ('RON', 'Romanian Leu', 'lei'),
    ('SEK', 'Swedish Krona', 'kr'),
    ('TRY', 'Turkish Lira', '₺');
`;

const createProfileTableQuery = `
    CREATE TABLE profiles (
        "profileId" SERIAL PRIMARY KEY,
        "userId" INT UNIQUE NOT NULL,
        "userName" VARCHAR(50),
        "currencyId" INT,
        "mailConfirmed" BOOLEAN DEFAULT FALSE,
        "locale" VARCHAR(10),
        "additionalInfo" JSONB,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
        "confirmationCode" INT NOT NULL,
        "confirmed" BOOLEAN DEFAULT FALSE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
            console.log('OK: ' + name);
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
    await initTable(createAccountTableQuery);
    await initTable(createCategoriesTableQuery);
    await initTable(createTransactionsTableQuery);
    await initTable(createEmailConfirmationTableQuery);
    _db.end();
};

_db.on('connect', (client) => {
    run();
});
