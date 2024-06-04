import { getConfig } from 'src/config/config';

const config = {
    database: getConfig().dbName,
    port: Number(getConfig().dbPort),
    password: getConfig().dbPass,
    user: getConfig().dbUser,
    host: getConfig().dbHost,
    cert: getConfig().dbCACert,
};
export default config;
