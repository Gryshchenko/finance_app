const axios = require('axios');
const fs = require('fs');
const https = require('https');

// const httpsAgent = new https.Agent({
//     ca: fs.readFileSync('/etc/ssl/cert.pem').toString(),
// });
const httpsAgent = new (require('https').Agent)({
    rejectUnauthorized: false, // Отключает проверку SSL
});
const url = 'https://localhost:3000/register/signup';

function generateRandomString(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

async function fuzzSignup() {
    const testData = {
        email: generateRandomString(10) + '@test.com',
        password: generateRandomString(Math.floor(Math.random() * 26) + 5),
        locale: Math.random() > 0.5 ? generateRandomString(5) : undefined,
    };

    try {
        const response = await axios.post(url, testData, {
            httpsAgent: httpsAgent,
        });
        console.log('Response:', response.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        fs.appendFileSync('./fuzz_errors.log', JSON.stringify(testData) + '\n');
    }
}

for (let i = 0; i < 100; i++) {
    fuzzSignup();
}
