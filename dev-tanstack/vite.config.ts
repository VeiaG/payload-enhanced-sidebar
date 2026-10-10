import { withPayload } from '@payloadcms/tanstack-start'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import rsc from '@vitejs/plugin-rsc'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(
  withPayload(
    ({ pluginOptions }) => ({
      plugins: [
        rsc(pluginOptions.rsc),
        tanstackStart(pluginOptions.tanstackStart),
        viteReact(pluginOptions.react),
      ],
      resolve: {
        alias: {
          '@/': `${path.resolve(__dirname, 'src')}/`,
        },
      },
      // Shares `dev/public` with the Next dev app (the avatar photo lives there)
      publicDir: path.resolve(__dirname, '../dev/public'),
      server: {
        // The Next dev app runs on 3000
        port: 3001,
        warmup: {
          clientFiles: [
            './src/app/__root.tsx',
            './src/app/_payload.tsx',
            './src/app/_payload/admin.index.tsx',
            './src/app/_payload/admin.$.tsx',
          ],
        },
      },
    }),
    {
      // The dev config's in-memory MongoDB (`dev/helpers/memoryDb.ts`) is CommonJS that breaks
      // under the RSC plugin's CJS-to-ESM rewrite (`__cjs_module_runner_transform`); Node loads it
      // as is instead. Dev serve only — the build bundles CommonJS fine.
      devServerExternalPackages: ['mongodb-memory-server', 'mongodb-memory-server-core'],
      payloadConfigPath: path.resolve(__dirname, 'src', 'payload.config.ts'),
    },
  ),
)
