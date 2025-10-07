import type { Awaitable } from '@namesmt/utils'
import type { Context, MiddlewareHandler } from 'hono'
import type { CookieOptions } from 'hono/utils/cookie'
import { isDeepEqual, unix } from '@namesmt/utils'
import { env } from 'hono/adapter'
import { getCookie, setCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'
import { seal, defaults as sealDefaults, unseal } from './internal/iron-crypto'

export class CookieState<T extends Record<string, any>> {
  public metadata: Record<string, any> = {}

  public data: T
  public dataSnapshot: string

  public refreshSession = false

  constructor({ data, metadata }: { data: T, metadata?: Record<string, any> }) {
    if (metadata)
      this.metadata = metadata

    this.data = data
    this.dataSnapshot = JSON.parse(JSON.stringify(data))
  }
}

export interface CreateCookieStateParams<T extends Record<string, any>> {
  /**
   * Main key, used as Hono variable name and default cookie name
   */
  key: string

  /**
   * Name of the cookie
   *
   * @default ${key}
   */
  cookieKey?: string

  /**
   * Secret used to sign the cookie, min length is 32
   *
   * While the interface allows optional and have a default value,
   * it will log a WARNING if no secret is explicitly provided (due to some runtime's constraints to access env vars on init)
   *
   * @default ${env.COOKIE_STATE_SECRET}
   */
  secret?: string | ((env: Record<string, string | undefined>) => string)

  /**
   * The initial data of the CookieState instance
   *
   * NOTE: This function is run even if there is data from the previous cookie, data is shallow merged together.
   */
  initData?: (c: Context) => Awaitable<T>

  /**
   * Whether to refresh the session automatically when its near expiration (16 minutes)
   *
   * @default true
   */
  autoRefreshSession?: boolean

  cookieOptions?: CookieOptions
}
export function createCookieState<T extends Record<string, any>, K extends string>({ key, secret, initData, autoRefreshSession = true, cookieOptions }: CreateCookieStateParams<T> & { key: K }): MiddlewareHandler<{
  Variables: { [key in K]: CookieState<T> }
}> {
  if (!secret) {
    console.warn('[createCookieState]: No secret provided for cookie state, it is recommended to explicitly set `secret`')
    secret = env => env.COOKIE_STATE_SECRET ?? 'cookie-state-secret_cookie-state-secret'
  }

  return createMiddleware(async (c, next) => {
    const envs = env(c) as Record<string, string | undefined>
    const secretPwd = typeof secret === 'function' ? secret(envs) : secret

    const pDCookie = getCookie(c, key)
    const pD = pDCookie
      ? await unseal(pDCookie, secretPwd, sealDefaults).catch(() => ({})) as { data?: T, metadata?: Record<string, any> }
      : null

    const iData = initData ? await initData(c) : {} as T
    const CSI = new CookieState<T>(pD ? { ...pD, data: { ...iData, ...pD } } : { data: iData })

    c.set(key, CSI)

    // Set refreshSession flag if nearly expired (16 minutes)
    if (autoRefreshSession && CSI.metadata.exp && (CSI.metadata.exp > (unix() - 960)))
      CSI.refreshSession = true

    await next()

    if (CSI.refreshSession || !isDeepEqual(CSI.data, CSI.dataSnapshot)) {
      CSI.metadata.exp = cookieOptions?.maxAge ? unix() + cookieOptions.maxAge : undefined

      setCookie(
        c,
        key,
        await seal({ data: CSI.data, metadata: CSI.metadata }, secretPwd, { ...sealDefaults, ...(cookieOptions?.maxAge && { ttl: cookieOptions.maxAge }) }),
        cookieOptions,
      )
    }
  })
}
