import { createCookieState } from '#src/index.js'
import { expect, it } from 'vitest'

it('shouldBe200', () => {
  expect(createCookieState).toBeDefined()
})
