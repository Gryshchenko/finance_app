const { execSync } = require('child_process');

// Функция для выполнения команд
const executeCommand = (command) => {
    try {
        execSync(command, { stdio: 'inherit' });
    } catch (error) {
        console.error(`Error executing command: ${command}`);
        console.error(error.message);
    }
};
const stopPostgresService = () => {
    executeCommand('brew services stop postgresql');
};

const brewCleanUp = () => {
    executeCommand('brew cleanup');
};

const cleanPostgresService = () => {
    executeCommand('rm -rf /usr/local/var/postgres');
};

const main = async () => {
    stopPostgresService();
    brewCleanUp();
    cleanPostgresService();
    console.log('PostgreSQL remove completed.');
};

main();
