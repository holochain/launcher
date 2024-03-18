const assert = require('assert');
const fs = require('fs');

import { IntegrityChecker } from '../integrityChecker';

describe('Testing integrity checker', () => {
  describe('Test signing and verifying of data', () => {
    it('Signing and subsequently verifying data with the same IntegrityChecker instance should return true', () => {
      const data = 'test123';
      const iC = new IntegrityChecker('passphrase');
      const signature = iC.sign(data);
      assert.equal(iC.verify(data, signature), true);
    });

    it('Signing data with IntegrityCheckers instantiated with a different passhprase should return different results.', () => {
      const data = 'test123';
      const iC1 = new IntegrityChecker('passphrase1');
      const iC2 = new IntegrityChecker('passphrase2');

      const signature1 = iC1.sign(data);
      const signature2 = iC2.sign(data);

      assert.notEqual(signature1, signature2);
    });
  });

  describe('Test reading and writing of signed data', () => {
    it('Data should remain unaltered after writing it to and subsequently reading it from a signed JSON file', () => {
      const writeData = 'test123';
      const iC = new IntegrityChecker('passphrase');
      iC.storeToSignedJSON('./out-tests/test.json', writeData);
      const readData = iC.readSignedJSON('./out-tests/test.json');
      assert.equal(writeData, readData);
    });

    it('Reading signed JSON with an IntegrityChecker instantiated with a different passphrase than the one used to write the signed JSON should fail', () => {
      const writeData = 'test123';
      const iC = new IntegrityChecker('passphrase1');
      iC.storeToSignedJSON('./out-tests/test.json', writeData);

      assert.throws(() => {
        const iC2 = new IntegrityChecker('passphrase2');
        iC2.readSignedJSON('./out-tests/test.json');
      }, Error);
    });

    it('Reading signed JSON with an IntegrityChecker should fail if the file was tampered with', () => {
      const writeData = 'test123';
      const filePath = './out-tests/test.json';
      const iC = new IntegrityChecker('passphrase');
      iC.storeToSignedJSON(filePath, writeData);
      // tamper with file
      const readString = fs.readFileSync(filePath, 'utf-8');
      fs.writeFileSync(filePath, readString + 'tampered');
      assert.throws(() => {
        const iC2 = new IntegrityChecker('passphrase');
        iC2.readSignedJSON(filePath);
      }, Error);
    });
  });
});
