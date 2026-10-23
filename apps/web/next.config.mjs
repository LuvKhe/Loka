import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },

  transpilePackages: ['@loka/shared'],

  webpack(config) {
    const sharedRoot = path.resolve(__dirname, '../../shared')

    config.resolve.alias = {
      ...config.resolve.alias,
      '@loka/shared': path.join(sharedRoot, 'index.ts'),
      '@loka/shared/types': path.join(sharedRoot, 'types/index.ts'),
      '@loka/shared/constants': path.join(sharedRoot, 'constants/index.ts'),
      '@loka/shared/validation': path.join(sharedRoot, 'validation/index.ts'),
      '@loka/shared/timetable': path.join(sharedRoot, 'timetable/index.ts'),
    }

    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
    }

    return config
  },
}

export default nextConfig
