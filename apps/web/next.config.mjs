import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile the shared workspace package so Next.js can import TS source directly
  transpilePackages: ['@loka/shared'],

  webpack(config) {
    // Resolve @loka/shared/* to the source tree
    const sharedRoot = path.resolve(__dirname, '../../shared')

    config.resolve.alias = {
      ...config.resolve.alias,
      '@loka/shared': path.join(sharedRoot, 'index.ts'),
      '@loka/shared/types': path.join(sharedRoot, 'types/index.ts'),
      '@loka/shared/constants': path.join(sharedRoot, 'constants/index.ts'),
      '@loka/shared/validation': path.join(sharedRoot, 'validation/index.ts'),
      '@loka/shared/timetable': path.join(sharedRoot, 'timetable/index.ts'),
    }

    // Allow .js imports to resolve to .ts files (ESM interop for shared package)
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
    }

    return config
  },
}

export default nextConfig
