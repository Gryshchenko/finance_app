const { execSync } = require('child_process');
const { Client } = require('pg');

const DB_NAME = 'fin_app';
const DB_USER = 'gryshchenko';
const DB_PASS = 'qwerty';
const DB_PORT = 5432;
const DB_HOST = 'localhost';

// Функция для выполнения команд
const executeCommand = (command) => {
    try {
        execSync(command, { stdio: 'inherit' });
    } catch (error) {
        console.error(`Error executing command: ${command}`);
        console.error(error.message);
    }
};

// Установка PostgreSQL через Homebrew
const installPostgres = () => {
    console.log('Installing PostgreSQL...');
    executeCommand('brew install postgresql');
};

// Инициализация базы данных
const initializeDatabase = () => {
    console.log('Initializing PostgreSQL database...');
    executeCommand('initdb /usr/local/var/postgres');
};

// Запуск службы PostgreSQL
const startPostgresService = () => {
    console.log('Starting PostgreSQL service...');
    executeCommand('brew services start postgresql');
};

// Настройка базы данных и пользователя
const setupDatabase = async () => {
    const client = new Client({
        user: 'postgres',
        host: DB_HOST,
        database: 'postgres',
        password: ' ',
        port: DB_PORT,
    });

    try {
        await client.connect();

        // Удаление пользователя, если он уже существует (чтобы избежать конфликтов)
        await client.query(`DROP USER IF EXISTS ${DB_USER};`);
        // Создание пользователя с правами суперпользователя
        await client.query(`CREATE USER ${DB_USER} WITH SUPERUSER PASSWORD '${DB_PASS}';`);
        // Создание базы данных с владельцем, указанным выше
        await client.query(`CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};`);
        await client.query(`GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};`);

        console.log(`Database ${DB_NAME} and user ${DB_USER} created successfully.`);
    } catch (error) {
        console.error('Error setting up database:', error.message);
    } finally {
        await client.end();
    }
};

// Основная функция
const main = async () => {
    // Установка PostgreSQL (если не установлен)
    // if (!execSync('brew list | grep postgresql')) {
    // installPostgres();
    // } else {
    //     console.log('PostgreSQL is already installed.');
    // }

    // Инициализация базы данных (если необходимо)
    // initializeDatabase();

    // Запуск службы PostgreSQL
    // startPostgresService();

    // Настройка базы данных и пользователя
    await setupDatabase();

    console.log('PostgreSQL setup completed.');
};

main();
