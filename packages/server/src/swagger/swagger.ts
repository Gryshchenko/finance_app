import { Express } from 'express';
import { initialize } from 'express-openapi';
import fs from 'fs';
import path from 'path';

const swaggerUi = require('swagger-ui-express');

const apiSpec = JSON.parse(fs.readFileSync(path.join(__dirname, 'api.json'), 'utf8'));

export const swaggerInit = (app: Express) => {
    initialize({
        app,
        apiDoc: apiSpec,
        paths: path.resolve('src/routes'),
    });
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(apiSpec));
};
