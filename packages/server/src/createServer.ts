import { Express } from 'express';

import http from 'http';
// import https from 'https';
// import fs from 'fs';
// import path from 'path';
// import process from 'node:process';

const createServer = (app: Express) => {
    // if (process.env.NODE_ENV !== 'development') {
    //     const privateKey = fs.readFileSync(path.join(__dirname + '/certs/', '192.168.0.164+2-key.pem'), 'utf8');
    //     const certificate = fs.readFileSync(path.join(__dirname + '/certs/', '192.168.0.164+2.pem'), 'utf8');
    //
    //     const credentials: { key: string; cert: string } = { key: privateKey, cert: certificate };
    //     return https.createServer(credentials, app);
    // }
    return http.createServer(app);
};

export { createServer };
