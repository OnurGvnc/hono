import type { MiddlewareHandler } from '../../hono.ts'

type prettyOptions = {
  space: number
}

export const prettyJSON = (options: prettyOptions = { space: 2 }): MiddlewareHandler => {
  return async (c, next) => {
    const pretty = c.req.query('pretty') || c.req.query('pretty') === '' ? true : false
    c.pretty(pretty, options.space)
    await next()
  }
}
