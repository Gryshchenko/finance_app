const knex = require('knex');
const config = require('./knexfile');
const { exec } = require('child_process');
const { Client } = require('pg');

before(async function () {
    this.timeout(10000); // Увеличить тайм-аут, если необходимо
    await new Promise((resolve, reject) => {
        exec('node setupTestDB.js setup', (err, stdout, stderr) => {
            if (err) {
                return reject(err);
            }
            console.log(stdout);
            resolve();
        });
    });

    this.knex = knex(config.test);
    await this.knex.migrate.latest();
});

after(async function () {
    await new Promise((resolve, reject) => {
        exec('node setupTestDB.js teardown', (err, stdout, stderr) => {
            if (err) {
                return reject(err);
            }
            console.log(stdout);
            resolve();
        });
    });
});
