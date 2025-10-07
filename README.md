<div align="center">

<h1>Hono Cookie State</h1>

</div>

# hono-cookie-state ![TypeScript heart icon](https://img.shields.io/badge/♡-%23007ACC.svg?logo=typescript&logoColor=white)

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Codecov][codecov-src]][codecov-href]
[![Bundlejs][bundlejs-src]][bundlejs-href]
[![TypeDoc][TypeDoc-src]][TypeDoc-href]

* [hono-cookie-state ](#hono-cookie-state-)
  * [Overview](#overview)
  * [Features](#features)
  * [Usage](#usage)
    * [Install package](#install-package)
    * [Import and use](#import-and-use)
  * [Roadmap](#roadmap)
  * [Credits and Notes](#credits-and-notes)
  * [License](#license)

## Overview

**hono-cookie-state** is a simple library to persist data / states in cookies for Hono, securely (via [`iron-webcrypto`](https://github.com/brc-dd/iron-webcrypto)) and with type-safety.

## Features

+ 👌 TypeScript

## Usage

### Install package

```sh
# npm
npm install -D hono-cookie-state

# bun
bun add -D hono-cookie-state

# pnpm
pnpm install -D hono-cookie-state
```

### Import and use

```ts
import type { CookieState } from 'hono-cookie-state'
import { createCookieState } from 'hono-cookie-state'

// Usage is as simple .use() the created middleware, and just update the state's data, the cookie will automatically be updated when the data has changed, or is near expiration with `autoRefreshSession=true` (default)
const app = new Hono()
  .use(createCookieState({
    key: 'hiWorld',
    secret: 'password_at_least_32_characters!',
    cookieOptions: {
      maxAge: 90 * 60, // 90 mins
      sameSite: 'None',
      secure: true,
      path: '/',
      httpOnly: true,
    },
  }))
  // For simple usage, variable type is automatically populated to context chain
  .get('/sample', async (c) => {
    const state = c.var.hiWorld // is of type CookieState<any>
    state.data.hi = 'world'
  })

// For more complex usage, you can populate Hono's init Env:
const app = new Hono<{ Variables: { helloWorld: CookieState<{ hello: string }> } }>()
// Or pass the generic into createCookieState, note you need to also pass the key as the second generic, due to TS limitation:
createCookieState<{ helloWorld: CookieState<{ hello: string }> }, 'hiWorld'>({
  key: 'hiWorld',
  secret: 'password_at_least_32_characters!',
})
```

## Roadmap

- Chunked cookie support
  - Awaits [honojs/hono#4447](https://github.com/honojs/hono/issues/4447)

## Credits and Notes

This package copies the inline, rewritten [`iron-crypto.ts`](https://github.com/brc-dd/iron-webcrypto) and base64url `encoding.ts` from [h3](https://github.com/h3js/h3)

## License

[![License][license-src]][license-href]

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/hono-cookie-state?labelColor=18181B&color=F0DB4F
[npm-version-href]: https://npmjs.com/package/hono-cookie-state
[npm-downloads-src]: https://img.shields.io/npm/dm/hono-cookie-state?labelColor=18181B&color=F0DB4F
[npm-downloads-href]: https://npmjs.com/package/hono-cookie-state
[codecov-src]: https://img.shields.io/codecov/c/gh/namesmt/hono-cookie-state/main?labelColor=18181B&color=F0DB4F
[codecov-href]: https://codecov.io/gh/namesmt/hono-cookie-state
[license-src]: https://img.shields.io/github/license/namesmt/hono-cookie-state.svg?labelColor=18181B&color=F0DB4F
[license-href]: https://github.com/namesmt/hono-cookie-state/blob/main/LICENSE
[bundlejs-src]: https://img.shields.io/bundlejs/size/hono-cookie-state?labelColor=18181B&color=F0DB4F
[bundlejs-href]: https://bundlejs.com/?q=hono-cookie-state
[jsDocs-src]: https://img.shields.io/badge/Check_out-jsDocs.io---?labelColor=18181B&color=F0DB4F
[jsDocs-href]: https://www.jsdocs.io/package/hono-cookie-state
[TypeDoc-src]: https://img.shields.io/badge/Check_out-TypeDoc---?labelColor=18181B&color=F0DB4F
[TypeDoc-href]: https://namesmt.github.io/hono-cookie-state/
