import { default as $RefParser, $Refs } from '@apidevtools/json-schema-ref-parser'
import { Pointer } from '@apidevtools/json-schema-ref-parser/lib/pointer'
import jsonpath from 'jsonpath'
import path from 'path'
import { Ref, slash, tilde, escape, save, log, baseApi } from './utils'

class OpenApiBuilder {
  baseUrl: string = ''
  parser: $RefParser = new $RefParser()
  $refs: $Refs

  constructor(baseUrl: string, data: object) {
    this.baseUrl = baseUrl
    this.parser = new $RefParser()
    this.parser.parse(data)
  }

  get($ref: string): any {
    return this.parser.$refs.get($ref)
  }

  /*addPath(name: string, value: object): void {
    this.refs.paths[name] = value
  }

  setValue<T extends string>($ref: T, value: any): T {
    this.refs.set($ref, value)
    return $ref
  }*/

  async parse(url: string) {
    url = path.join(this.baseUrl, url)
    return await $RefParser.parse(url)
    //const data = await this.parser.parse(url)
  }

  append($ref: string, value: object): void {
    log('append')
    log($ref)
    log(value)
    this.parser.$refs.set($ref, value)
  }

  has($ref): boolean {
    return this.parser.$refs.exists($ref)
  }

  get data() {
    return this.parser.schema
  }
}

const loader = (basePath: string) =>
  async (file: string) =>
    await $RefParser.parse(path.resolve(basePath, file))

type Paths = {
  [key: string]: any
}

const componentTarget = (component: string, name: string) =>
  escape('#', 'components', component, extractName(name))
const createRef = ($target: string) =>
  ({ $ref: $target })
const extractName = (url: string): string => url.match(extractNameRegex).groups.name


//const validPathReference = /components\//
const extractNameRegex = /(?<name>[^\/]+)?\.[a-z]+$/
const resolve = async (schemaFile: string, target: string): Promise<void> => {
  const baseUrl = path.dirname(schemaFile)
  let parser = new OpenApiBuilder(baseUrl, baseApi)

  const BASE = await parser.parse(path.basename(schemaFile))

  for (const externalRef of BASE.paths) {
    if (!externalRef.$ref) throw new TypeError('Referencia no definida')

    const data = await parser.parse(externalRef.$ref)
    for (const [pathUrl, pathDefinition] of Object.entries<Paths>(data)) {
      //let a = jsonpath.nodes(pathDefinition, `$['get','post','put','delete']`)
      for (const [method, request] of Object.entries(pathDefinition)) {
        if (/get|post|put|delete/ig.test(method) === false) continue
        if (request.responses) {
          for (const [status, response] of Object.entries<Ref | Paths>(request.responses)) {
            let $target: string
            let responseDefinition: any
            if ('$ref' in response) {
              $target = componentTarget('responses', response.$ref)
              responseDefinition = await parser.parse(response.$ref)
            } else {
              log(externalRef.$ref)
              let name = `${extractName(externalRef.$ref)}.${method}.${status})`
              $target = componentTarget('responses', name)
              responseDefinition = response
            }
            parser.append($target, responseDefinition)
            const $ref = createRef($target)
            pathDefinition[method].responses[status] = $ref
          }
          /*const [status, response] = Object.entries(request.responses)

          console.log(request.responses)*/
        }
      }
      //
    }
  }

  /*const externalRefsPath = `$.paths..schema['$ref']`
  const externalRefs = jsonpath.nodes(parser.data, externalRefsPath)
  for (const { path: url, value: ref } of externalRefs) {
    const $target = escape('#', 'components', 'schemas', extractName(ref))
    if (!parser.has($target)) {
      const data = await parser.parse(ref)
      parser.append($target, data)
    }

    const $ref = escape('#', ...url.slice(1, -1).map((s) => s.toString()))
    parser.append($ref, createRef($target))
  }*/



  //log(parser.data)
  //log(parser.$refs.paths())
  //save(target, openApi)


  /*const basePath = path.dirname(schemaFile)
  const baseFile = path.basename(schemaFile)
  const load = loader(basePath)
  const baseApi = await load(baseFile)
  //let openApi = new OpenApiBuilder()
  //openApi.setValue('servers', baseApi.servers)

  //const paths = jsonpath.value(openApi, '$..paths')
  for (const { $ref } of paths) {
    if (!$ref) throw new TypeError('Referencia no definida')

    for (const [url, value] of Object.entries<Paths>(await load($ref))) {
      //openApi.setValue(`paths/${escape(url)}`, value)
    }
  }*/
  //log(openApi.toOpenApi())
  /*const $refs = await $RefParser.resolve(schema)
  const bundled = await $RefParser.bundle(schema)

  const openapi = {
    ...$refs.get('#'),
    components: {
      schemas: {}
    }
  }
  const pathsPath = '#/paths'
  openapi.paths = Object.entries<Ref | any>($refs.get(pathsPath))
    .reduce((paths, [path, value]) => {
      if (value.$ref) {
        value = $refs.get([pathsPath, escape(path)].join('/'))
      }

      return { [path]: value, ...paths }
    }, {})*/

  //openapi.components.schemas = jsonpath.paths('$..schema.$ref')
  //log(jsonpath.paths(bundled, '$..schema'))
  //log(Object.keys($refs['_$refs']))

  //
  //log(openapi)
}

console.clear()
resolve('./src/consultorio/index.yml', './src/openapi.json')
