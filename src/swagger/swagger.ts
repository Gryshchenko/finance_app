import { Express } from 'express';

const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');
const pack = require('../../package.json');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: pack.name,
            version: pack.version,
            description: 'This is a simple API to manage users in a system.',
            license: {
                name: 'Licensed Under MIT',
                url: 'https://spdx.org/licenses/MIT.html',
            },
            servers: {
                url: 'https://localhost:3000',
            },
        },
    },
    apis: ['./src/swagger/apiDefinitions.ts', `./src/routes/*.ts`],
};

const swaggerSpec = swaggerJSDoc(options);

export const swaggerInit = (app: Express) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
