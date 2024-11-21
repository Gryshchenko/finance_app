const cors = require('cors');

const corsOptions = {
    origin: 'https://example.com',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
};
export const checkCors = () => cors(corsOptions);
