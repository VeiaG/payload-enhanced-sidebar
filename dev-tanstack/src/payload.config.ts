import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { createDevConfig } from '../../dev/payload.config'

const dirname = path.dirname(fileURLToPath(import.meta.url))

// The same dev config as the Next app in `dev/`, with this app's own import map
export default createDevConfig({
  importMapFile: path.resolve(dirname, 'app/_payload/importMap.js'),
})
