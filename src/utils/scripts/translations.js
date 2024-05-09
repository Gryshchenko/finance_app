const fs = require('fs');
const path = require('path');
const { stdin: input, stdout: output } = require('node:process');
const enumPath = './src/types/';

class Translations {
    keys = null;
    constructor() {
        this.init();
    }

    async init() {
        console.log('Fetching keys.');
        console.log();

        await this.fetchKeys();

        await this.generateEnumFile();

        console.log('Work done!');
        console.log();

        process.exit(0);
    }

    async fetchKeys() {
        this.keys = await new Promise((resolve, reject) => {
            fs.readFile(path.join('src/locales/en-US.json'), 'utf8', function (err, data) {
                if (err) throw err;
                resolve(JSON.parse(data));
            });
        });
    }

    generateEnumFile() {
        const filename = 'TranslationKey.ts';
        const enumFileHead = `export enum TranslationKey {\n`;
        const enumFileTail = `}\n`;

        const usedKeys = new Map();

        const enumFileContent = Object.keys(this.keys).reduce((content, name) => {
            if (name.includes(' ') || usedKeys.has(name)) {
                return content;
            }

            usedKeys.set(name, name);

            return `${content}\t${name} = '${name}',\n`;
        }, '');

        const contents = `${enumFileHead}${enumFileContent}${enumFileTail}`;
        console.log(path.join(enumPath, filename));

        return new Promise((resolve) => {
            fs.writeFile(path.join(enumPath, filename), contents, (err) => {
                if (err) return console.error(`Error creating "${filename}"!`);

                console.log(`Created: ${filename}`);
                resolve();
            });
        });
    }
}

new Translations();
