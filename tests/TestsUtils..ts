const crypto = require('crypto');

export function generateSecureRandom() {
    const buffer = crypto.randomBytes(4);
    return buffer.readUInt32BE(0) / (0xffffffff + 1);
}

export function generateRandomEmail(len = Math.floor(generateSecureRandom() * 10) + 5) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let userNameLength = len;
    let userName = 'test_';

    for (let i = 0; i < userNameLength; i++) {
        userName += chars.charAt(Math.floor(generateSecureRandom() * chars.length));
    }

    const domains = ['test.com', 'example.com', 'demo.com']; // список возможных доменов
    const domain = domains[Math.floor(generateSecureRandom() * domains.length)];

    return `${userName}@${domain}`;
}

export function generateRandomPassword(len = Math.floor(generateSecureRandom() * 9) + 8) {
    const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
    const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const allChars = lowerChars + upperChars + numbers + specialChars;
    let passwordLength = len;
    let password = '';

    password += lowerChars.charAt(Math.floor(generateSecureRandom() * lowerChars.length));
    password += upperChars.charAt(Math.floor(generateSecureRandom() * upperChars.length));
    password += numbers.charAt(Math.floor(generateSecureRandom() * numbers.length));
    password += specialChars.charAt(Math.floor(generateSecureRandom() * specialChars.length));

    for (let i = password.length; i < passwordLength; i++) {
        password += allChars.charAt(Math.floor(generateSecureRandom() * allChars.length));
    }

    password = password
        .split('')
        .sort(() => 0.5 - generateSecureRandom())
        .join('');

    return password;
}
