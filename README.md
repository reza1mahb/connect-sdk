# Coin98 Connect

[![NPM](https://img.shields.io/npm/v/@coin98-com/connect-sdk.svg)](https://www.npmjs.com/package/@coin98-com/connect-sdk) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save @coin98-com/connect-sdk
```

## Usage

### Dapps Website Connection Example
```ts
import { Client, Chain } from '@coin98-com/connect-sdk'

const client = new Client()


client.connect(Chain.fantom, {
  logo: "Dapps Logo URL",
  name: "Dapps Name",
  url: "Dapps URL"
})

```
### React Native Connection (Without Expo) Example
```ts
import { Client, Chain } from '@coin98-com/connect-sdk/dist/native'

const client = new Client()

client.connect(Chain.fantom, {
  logo: "Dapps Logo URL",
  name: "Dapps Name",
  callbackURL: "Application URI Schema"
})
```


### Lite without any handler (Example With React Native)
```ts
import { Client, Chain } from '@coin98-com/connect-sdk/dist/lite'
import { Linking } from 'react-native'
const client = new Client({
  callback(cUrl){
    Linking.openURL(cUrl);
  }
})

client.connect(Chain.fantom, {
  logo: "Dapps Logo URL",
  name: "Dapps Name",
  callbackURL: "Application URI Schema"
})
```

### Common API Request

```ts
// Common API
client.request({
  method: "<Your Request Method Here>",
  params: [],
  redirect: "(Optional), Callback URL after handle request"
}): Promise<{ result, error }>
```

Currently supported connection for EVM, Solana, Near, Cosmos
