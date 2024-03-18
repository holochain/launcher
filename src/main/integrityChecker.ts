import elliptic from 'elliptic';
import fs from 'fs';

export type SignedContent<T> = {
  content: T;
  signature: string;
};

export class IntegrityChecker {
  keypair: elliptic.eddsa.KeyPair;

  constructor(passphrase: string) {
    const seed = Buffer.from(passphrase);
    const eddsa = new elliptic.eddsa('ed25519');
    this.keypair = eddsa.keyFromSecret(seed);
  }

  sign(data: string): string {
    return this.keypair.sign(Buffer.from(data)).toHex();
  }

  verify(data: string, signature: string): boolean {
    return this.keypair.verify(Buffer.from(data), signature);
  }

  storeToSignedJSON<T>(path: fs.PathLike, content: T): void {
    const stringifiedContent = JSON.stringify(content);
    const signature = this.sign(stringifiedContent);
    const fileContent = {
      content,
      signature,
    };
    fs.writeFileSync(path, JSON.stringify(fileContent, undefined, 2), 'utf-8');
  }

  readSignedJSON<T>(path: fs.PathLike): T {
    const fileContentString = fs.readFileSync(path, 'utf-8');
    const signedContent: SignedContent<T> = JSON.parse(fileContentString);
    const signatureValid = this.verify(
      JSON.stringify(signedContent.content),
      signedContent.signature,
    );
    if (!signatureValid) throw new Error('Invalid signature: File is corrupted.');
    return signedContent.content;
  }
}
