export function generateRandomEmail(len = Math.floor(Math.random() * 10) + 5) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let userNameLength = len;
    let userName = 'test_';

    for (let i = 0; i < userNameLength; i++) {
        userName += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const domains = ['test.com', 'example.com', 'demo.com']; // список возможных доменов
    const domain = domains[Math.floor(Math.random() * domains.length)];

    return `${userName}@${domain}`;
}

export function generateRandomPassword(len = Math.floor(Math.random() * 9) + 8) {
    const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
    const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const allChars = lowerChars + upperChars + numbers + specialChars;
    let passwordLength = len;
    let password = '';

    password += lowerChars.charAt(Math.floor(Math.random() * lowerChars.length));
    password += upperChars.charAt(Math.floor(Math.random() * upperChars.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));

    for (let i = password.length; i < passwordLength; i++) {
        password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }

    password = password
        .split('')
        .sort(() => 0.5 - Math.random())
        .join('');

    return password;
}
