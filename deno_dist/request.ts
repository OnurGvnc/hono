import { parseBody } from './utils/body.ts'
import type { Cookie } from './utils/cookie.ts'
import { parse } from './utils/cookie.ts'
import { getQueryStringFromURL } from './utils/url.ts'

declare global {
  interface Request<ParamKeyType extends string = string> {
    paramData?: Record<ParamKeyType, string>
    param: {
      (key: ParamKeyType): string
      (): Record<ParamKeyType, string>
    }
    queryData?: Record<string, string>
    query: {
      (key: string): string
      (): Record<string, string>
    }
    queries: {
      (key: string): string[]
      (): Record<string, string[]>
    }
    headerData?: Record<string, string>
    header: {
      (name: string): string
      (): Record<string, string>
    }
    cookie: {
      (name: string): string
      (): Cookie
    }
    bodyData?: Record<string, string | File>
    parseBody: {
      (): Promise<Record<string, string | File>>
    }
    jsonData?: any
    json: {
      (): Promise<any>
    }
  }
}

export function extendRequestPrototype() {
  if (!!Request.prototype.param as boolean) {
    // already extended
    return
  }

  Request.prototype.param = function (this: Request, key?: string) {
    if (this.paramData) {
      if (key) {
        return this.paramData[key]
      } else {
        return this.paramData
      }
    }
    return null
  } as InstanceType<typeof Request>['param']

  Request.prototype.header = function (this: Request, name?: string) {
    if (!this.headerData) {
      this.headerData = {}
      for (const [key, value] of this.headers) {
        this.headerData[key] = value
      }
    }
    if (name) {
      return this.headerData[name.toLowerCase()]
    } else {
      return this.headerData
    }
  } as InstanceType<typeof Request>['header']

  Request.prototype.query = function (this: Request, key?: string) {
    const queryString = getQueryStringFromURL(this.url)
    const searchParams = new URLSearchParams(queryString)
    if (!this.queryData) {
      this.queryData = {}
      for (const key of searchParams.keys()) {
        this.queryData[key] = searchParams.get(key) || ''
      }
    }
    if (key) {
      return this.queryData[key]
    } else {
      return this.queryData
    }
  } as InstanceType<typeof Request>['query']

  Request.prototype.queries = function (this: Request, key?: string) {
    const queryString = getQueryStringFromURL(this.url)
    const searchParams = new URLSearchParams(queryString)
    if (key) {
      return searchParams.getAll(key)
    } else {
      const result: Record<string, string[]> = {}
      for (const key of searchParams.keys()) {
        result[key] = searchParams.getAll(key)
      }
      return result
    }
  } as InstanceType<typeof Request>['queries']

  Request.prototype.cookie = function (this: Request, key?: string) {
    const cookie = this.headers.get('Cookie') || ''
    const obj = parse(cookie)
    if (key) {
      const value = obj[key]
      return value
    } else {
      return obj
    }
  } as InstanceType<typeof Request>['cookie']

  Request.prototype.parseBody = async function (
    this: Request
  ): Promise<Record<string, string | File>> {
    // Cache the parsed body
    let body: Record<string, string | File>
    if (!this.bodyData) {
      body = await parseBody(this)
      this.bodyData = body
    } else {
      body = this.bodyData
    }
    return body
  } as InstanceType<typeof Request>['parseBody']

  Request.prototype.json = async function (this: Request): Promise<any> {
    // Cache the JSON body
    let jsonData: any
    if (!this.jsonData) {
      jsonData = JSON.parse(await this.text())
      this.jsonData = jsonData
    } else {
      jsonData = this.jsonData
    }
    return jsonData
  } as InstanceType<typeof Request>['jsonData']
}
