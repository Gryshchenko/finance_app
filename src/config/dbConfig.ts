import { readFileSync } from 'fs';

const config = {
    database: null,
    port: Number(process.env.DB_PORT),
    password: process.env.DB_PASS,
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
};
module.exports = config;
