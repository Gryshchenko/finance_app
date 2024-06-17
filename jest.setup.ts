const dotenv = require('dotenv');
dotenv.config({ path: '.env.test.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
