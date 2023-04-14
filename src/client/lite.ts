import { io } from 'socket.io-client'
import { EventEmitter } from 'events'
import { SERVER } from '../config'
import {
  EventType,
  requestParameter,
  connectNativeOptions,
  LiteClientConfig
} from '../types/client'
import { compact, uniqueId } from '../utils/functions'
import bs58 from '../utils/base58'
import BigIntPolyfill from 'bignumber.js'
import { CosmJSOfflineSigner, CosmJSOfflineSignerOnlyAmino } from './cosmos'

declare let window: any

class Coin98Client extends EventEmitter {
  protected isConnected: boolean = false
  protected isNative?: boolean = false
  private id?: string | number[]
  private createdWindow: Window
  public client: any

  public chain: string
  public callbackURL: string
  public callback: (link: string) => any

  constructor (config: LiteClientConfig) {
    super()

    this.isNative = true
    this.callback = config.callback

    // Polyfill
    if (typeof window !== 'undefined' && !window.BigInt) {
      window.BigInt = BigIntPolyfill
    }

    this.genConnection()
    return this
  }

  public connect = (
    chain: string,
    options: connectNativeOptions
  ) => {
    if (!chain) {
      throw new Error('Chain required')
    }

    if (!this.client) {
      throw new Error('Initialize SDK First')
    }

    if (!options.name) {
      throw new Error('Provide your app name before continue')
    }

    if (this.isNative) {
      if (!options.callbackURL) {
        throw new Error('Provide your callback URL For Native App')
      }
      this.callbackURL = options.callbackURL
    }

    this.chain = chain
    // Reset UUID for new connection
    this.id = options.id || uniqueId()

    if (options.id) {
      this.isConnected = true
      return options.id
    }

    return new Promise((resolve, reject) => {
      // Initialize SDK
      this.client.emit(
        'coin98_connect',
        {
          type: 'connection_request',
          message: {
            url: this.callbackURL,
            id: this.id
          }
        },
        async (cnnStr: string) => {
          // take response id and next
          this.id = cnnStr

          if (!this.isConnected) {
            const result: any = await this.request({
              method: 'connect',
              params: [options]
            })

            const errors = result?.error || result?.errors || !result.result

            if (errors) {
              return reject(new Error(errors.message || 'Connect Rejected'))
            }

            this.isConnected = true

            resolve(result)
          }
        }
      )
    })
  }

  public disconnect = () => {
    this.isConnected = false
    this.client.close()
  }

  public request = (args: requestParameter) => {
    this.genConnection()

    if (!this.isConnected && args.method !== 'connect') {
      throw new Error('You need to connect before handle any request!')
    }

    const id: string = uniqueId()

    const requestParams = {
      ...args,
      id,
      chain: this.chain
    }

    const isSolana: boolean = requestParams.method.startsWith('sol')
    const isCosmos: boolean = requestParams.method.startsWith('cosmos')

    if (isSolana) {
      requestParams.params = this.transformSolanaParams(
        requestParams.params,
        requestParams.method
      )
    }

    if (isCosmos) {
      requestParams.params = this.transformCosmosParams(
        requestParams.params,
        requestParams.method
      )
    }

    requestParams.redirect = encodeURI(
      this.callbackURL || window?.location?.href
    )

    const encodedURL = this.santinizeURL(`${this.id}&request=${this.santinizeParams(
      requestParams
    )}`)

    const _this = this
    return new Promise((resolve) => {
      _this.once(id, (e) => {
        this.createdWindow && this.createdWindow.close()
        resolve(e)
      })

      if (this.callback) {
        return this.callback(encodedURL)
      }
      return encodedURL
    })
  }

  // Cosmos Methods
  public getOfflineSigner (chainId: string) {
    return new CosmJSOfflineSigner(chainId, this)
  }

  public getOfflineSignerAuto (chainId: string) {
    return new CosmJSOfflineSigner(chainId, this)
  }

  public getOfflineSignerOnlyAmino (chainId: string) {
    return new CosmJSOfflineSignerOnlyAmino(chainId, this)
  }

  private transformSolanaParams = (params: any, method: string) => {
    if (method === 'sol_sign') {
      // Transform single transaction
      params[1] =
        typeof params[0] === 'string' || Array.isArray(params[0])
          ? 'message'
          : 'transaction'
      if (params[0].serializeMessage) {
        params[0] = bs58.encode(params[0].serializeMessage())
      }
    }

    if (method === 'sol_signAllTransactions' && Array.isArray(params[0])) {
      const arrTxs = params[0]

      params[0] = arrTxs.slice().map((txs) => {
        if (typeof txs === 'object' && txs.serializeMessage) {
          return bs58.encode(txs.serializeMessage())
        }
        return txs
      })
      params[0] = JSON.stringify(compact(params[0]))
    }

    if (method === 'sol_signMessage') {
      const bufferMsg =
        typeof params[0] === 'string'
          ? Buffer.from(params[0], 'utf-8')
          : params[0]
      params[0] = bs58.encode(bufferMsg)
    }

    return params
  }

  private transformCosmosParams = (params: any, method: string) => {
    if (method === 'cosmos_signDirect') {
      params[0].signDoc.bodyBytes = bs58.encode(params[0].signDoc.bodyBytes)
      params[0].signDoc.authInfoBytes = bs58.encode(
        params[0].signDoc.authInfoBytes
      )
    }

    return params
  }

  private santinizeParams = (params: object) => {
    return encodeURIComponent(JSON.stringify(params))
  }

  private santinizeURL = (url:string) => {
    // Santinize url
    url = encodeURIComponent(url)
    url = url.startsWith('coin98://') ? url : `coin98://${url}`
    return url
  }

  private genConnection () {
    return new Promise(resolve => {
      if (!this.client || this.client.disconnected) {
        this.client = io(SERVER, {
          transports: ['websocket']
        })

        this.client.on('connect', () => {
          resolve(true)
        })

        this.client.on('sdk_connect', (ev: EventType) => {
          const { id } = ev.data
          this.emit(id, ev.data)
        })

        this.client.on('disconnect', () => {
          this.isConnected = false
          this.emit('disconnect')
        })
      }
      resolve('')
    })
  }
}

export default Coin98Client
