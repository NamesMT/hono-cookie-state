import { CookieState, createCookieState } from '#src/index.js'
import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'

const SECRET = 'a-very-long-secret-string-for-cookie-state-testing-1234567890'

type State = CookieState<{ count: number }>

describe('createCookieState', () => {
  it('writes and reads state across requests', async () => {
    const app = new Hono<{ Variables: { state: State } }>()
    app.use(createCookieState<{ count: number }, 'state'>({ key: 'state', secret: SECRET }))

    app.get('/set', (c) => {
      const state: State = c.get('state')
      state.data.count = 42
      return c.text('ok')
    })

    app.get('/get', (c) => {
      const state: State = c.get('state')
      return c.text(String(state.data.count))
    })

    // First request writes state and returns a cookie
    const res1 = await app.request('/set')
    expect(res1.status).toBe(200)
    const cookie = res1.headers.get('set-cookie')?.split(';')[0]
    expect(cookie).toBeTruthy()

    // Second request reads state back from the cookie
    const res2 = await app.request('/get', { headers: { cookie: cookie! } })
    expect(res2.status).toBe(200)
    expect(await res2.text()).toBe('42')
  })

  it('uses the custom cookieKey as the cookie name while keeping the `key` variable', async () => {
    const app = new Hono<{ Variables: { state: State } }>()
    app.use(createCookieState<{ count: number }, 'state'>({ key: 'state', cookieKey: 'custom_state', secret: SECRET }))

    app.get('/set', (c) => {
      // The Hono variable is still keyed by `key`
      const state: State = c.get('state')
      expect(state).toBeInstanceOf(CookieState)
      state.data.count = 7
      return c.text('ok')
    })

    app.get('/get', (c) => {
      const state: State = c.get('state')
      return c.text(String(state.data.count))
    })

    const res1 = await app.request('/set')
    expect(res1.status).toBe(200)
    const cookie = res1.headers.get('set-cookie')?.split(';')[0]
    expect(cookie?.startsWith('custom_state=')).toBe(true)
    expect(cookie?.startsWith('state=')).toBe(false)

    // The custom cookie is unsealed on the next request
    const res2 = await app.request('/get', { headers: { cookie: cookie! } })
    expect(res2.status).toBe(200)
    expect(await res2.text()).toBe('7')

    // The `key`-named cookie is not used when `cookieKey` is set
    const res3 = await app.request('/get', { headers: { cookie: cookie!.replace('custom_state=', 'state=') } })
    expect(await res3.text()).toBe('undefined')
  })

  it('falls back to the `key` cookie name when no cookieKey is given', async () => {
    const app = new Hono<{ Variables: { state: State } }>()
    app.use(createCookieState<{ count: number }, 'state'>({ key: 'state', secret: SECRET }))

    app.get('/set', (c) => {
      c.get('state').data.count = 1
      return c.text('ok')
    })

    const res = await app.request('/set')
    expect(res.headers.get('set-cookie')?.startsWith('state=')).toBe(true)
  })
})
