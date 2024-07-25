import * as openpgp from 'openpgp';

export const decryptMessage = async (encryptedMessage: string) => {
  try {
    const binaryEncryptedMessage = new Uint8Array(
      encryptedMessage.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );
    const message = await openpgp.readMessage({
      binaryMessage: binaryEncryptedMessage
    });

    const { data: decrypted } = await openpgp.decrypt({
      message,
      passwords: [`${Bun.env.PGCRYPTO_KEY}`],
      format: 'binary'
    });

    let decryptedString: string;
    if (decrypted instanceof Uint8Array) {
      // Convert the decrypted Uint8Array to a string
      decryptedString = new TextDecoder().decode(decrypted);
    } else {
      decryptedString = decrypted as string;
    }
    return decryptedString
  } catch (error) {
    console.error('Error decrypting message:', error);
    throw error;
  }
};