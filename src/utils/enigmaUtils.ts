interface enigmaUtils {
  chainId: string
  client: any
}

export class KeplrEnigmaUtils implements enigmaUtils {
  chainId: string
  client: any

  constructor(chainId: string, client: any) {
    this.chainId = chainId
    this.client = client
  }

  async getPubkey() {
    return await this.client.getEnigmaPubKey(this.chainId)
  }

  async getTxEncryptionKey(nonce: number | string | Uint8Array) {
    return await this.client.getEnigmaTxEncryptionKey(this.chainId, nonce)
  }

  async encrypt(contractCodeHash: string, msg: object) {
    return await this.client.enigmaEncrypt(this.chainId, contractCodeHash, msg)
  }

  async decrypt(ciphertext: Uint8Array, nonce: Uint8Array) {
    return await this.client.enigmaDecrypt(this.chainId, ciphertext, nonce)
  }
}
