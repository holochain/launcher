/**
 * This scripts reads a file and logs its file size in bytes as well as its sha512 hash
 */

const filename = "";

const fs = require('fs');
const crypto = require('crypto');

const fileBytes = fs.readFileSync(filename);
console.log("Filesize: ", fileBytes.length);
const hasher = crypto.createHash('sha512');
hasher.update(fileBytes);
const sha512 = hasher.digest('base64');
console.log('sha512: ', sha512);