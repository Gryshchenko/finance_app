import { readFileSync } from 'fs';

const caCert = readFileSync('/etc/ssl/cert.pem').toString();

const config = {
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
    password: process.env.DB_PASS,
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    cert: caCert,
};
export default config;
