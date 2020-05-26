import $RefParser, { FileInfo, Options, $Refs } from '@apidevtools/json-schema-ref-parser'
import yamlParser from '@apidevtools/json-schema-ref-parser/lib/parsers/yaml'
import { safePointerToPath } from '@apidevtools/json-schema-ref-parser/lib/util/url'
import { promises as fs } from 'fs'
import path from 'path'

const jrlParser: $RefParser.ParserOptions = {
  order: 1,
  canParse: true,
  async parse(file: FileInfo): Promise<any> {
    const result = await yamlParser.parse(file)
    //console.log('---', file.url)
    //console.log(result)
    return result
  }
}

console.clear()

const options: Options = {
  parse: {
    jr: jrlParser
  }
}

const dereference = async (schema: string): Promise<void> => {
  //schema = path.resolve(process.cwd(), schema)
  const $refs = await $RefParser.dereference(schema, options)

  console.log($refs)
  console.log($refs.get('#/paths'))
  //console.log($refs.get('#/paths/~1consultorios'))
  //console.log($refs.get('#/components/securitySchemes'))
}

type Ref = {
  $ref: string
}

const slash = /\//g
const tilde = /~/g
const encode = (value: string): string => value.replace(tilde, '~0').replace(slash, '~1')

const resolve = async (schema: string): Promise<void> => {
  const $refs = await $RefParser.resolve(schema, options)

  const openapi = {
    ...$refs.get('#'),
    components: {

    }
  }
  const pathsPath = '#/paths'
  const paths = Object.entries<Ref | any>($refs.get(pathsPath))
    .map(([path, value]) => {
      if (value.$ref) {
        const $ref = [pathsPath, encode(path)].join('/')
        console.log('get', $ref)
        value = $refs.get($ref)
      }

      return [path, value]
    })

  openapi.paths = Object.fromEntries(paths)

  save(openapi)
}

const save = async (data: object) => await fs.writeFile('./src/openapi.json', JSON.stringify(data, null, 2), { encoding: 'utf-8' })

resolve('./src/kendu-consultorio.yml')
