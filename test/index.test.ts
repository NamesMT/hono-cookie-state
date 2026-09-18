import type { CookieState } from '#src/index.js'
import { createCookieState } from '#src/index.js'
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
})
