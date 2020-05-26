import util from 'util'
import { promises as fs } from 'fs'

export type Ref = {
  $ref: string
}

export const slash = /\//g
export const tilde = /~/g
export const escape = (...value: string[]): string =>
  value
    .map((s) => s.replace(tilde, '~0').replace(slash, '~1'))
    .join('/')
export const save = async (target: string, data: object) => await fs.writeFile(target, JSON.stringify(data, null, 2), { encoding: 'utf-8' })
export const log = (data) => console.log(util.inspect(data, false, null, true))
export class OpenApi {
  openapi: '3.0.2'
  info: {}
  security: {}
  tags: []
  servers: []
  paths: {}
  components: {}

  constructor(data: object) {
    for (const prop of ['info', 'security', 'paths', 'components']) {
      if (!data.hasOwnProperty(prop)) return
      if (!(data[prop] instanceof Object)) return
      this[prop] = { ...data[prop] }
    }

    for (const prop of ['tags', 'servers']) {
      if (!data.hasOwnProperty(prop)) return
      if (!(data[prop] instanceof Array)) return
      this[prop] = { ...data[prop] }
    }

    console.log('data', data)
  }
}
export const baseApi = {
  paths: {},
  components: {
    schemas: {},
    parameters: {},
    securitySchemes: {},
    requestBodies: {},
    responses: {},
    headers: {},
    examples: {},
    links: {},
    callbacks: {},
  }
}
