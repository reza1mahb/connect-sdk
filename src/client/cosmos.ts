import base58 from 'utils/base58'

export class CosmJSOfflineSignerOnlyAmino {
  chainId: string
  client: any

  constructor (chainId: string, client: any) {
    this.chainId = chainId
    this.client = client
  }

  async getAccounts () {
    const { result, error } = await this.client.request({
      method: 'cosmos_getKey',
      params: [this.chainId]
    })

    if (error) {
      throw new Error(error)
    }

    // Decode UInt8Array
    result.pubKey = base58.decode(result.pubKey)

    return [
      {
        address: result.bech32Address,
        // Only secp256k1 is supported.
        algo: 'secp256k1',
        pubkey: result.pubKey
      }
    ]
  }

  async signAmino (signerAddress: string, signDoc: any) {
    if (this.chainId !== signDoc.chain_id) {
      throw new Error('Unmatched chain id with the offline signer')
    }

    const { result: key } = await this.client.request({
      method: 'cosmos_getKey',
      params: [this.chainId]
    })

    if (key.bech32Address !== signerAddress) {
      throw new Error('Unknown signer address')
    }

    const response = await this.client.request({
      method: 'cosmos_signAmino',
      params: [this.chainId, signerAddress, signDoc]
    })

    return response.result || response
  }

  // Fallback function for the legacy cosmjs implementation before the stargate.
  async sign (signerAddress: string, signDoc: any) {
    return await this.signAmino(signerAddress, signDoc)
  }
}

export class CosmJSOfflineSigner extends CosmJSOfflineSignerOnlyAmino {
  chainId: string
  client: any

  constructor (chainId: string, client: any) {
    super(chainId, client)

    this.chainId = chainId
    this.client = client
  }

  async signDirect (signerAddress: string, signDoc: any) {
    if (this.chainId !== signDoc.chainId) {
      throw new Error('Unmatched chain id with the offline signer')
    }

    const key = await this.client.request({
      method: 'cosmos_getKey',
      params: [this.chainId]
    })

    if (key.bech32Address !== signerAddress) {
      throw new Error('Unknown signer address')
    }

    // Transform Data
    if (signDoc.bodyBytes instanceof Uint8Array) {
      signDoc.bodyBytes = base58.encode(signDoc.bodyBytes)
    }

    if (signDoc.authInfoBytes instanceof Uint8Array) {
      signDoc.authInfoBytes = base58.encode(signDoc.authInfoBytes)
    }

    const response = await this.client.request({
      method: 'cosmos_signDirect',
      params: [this.chainId, signerAddress, signDoc]
    })

    return response.result || response
  }
}
