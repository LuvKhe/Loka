import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

/** @type {import('next').NextConfig} */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseWs = supabaseUrl.replace(/^http/, 'ws')
const isDev = process.env.NODE_ENV !== 'production'

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseUrl} ${supabaseWs}${isDev ? ' ws://localhost:*' : ''}`.trim(),
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(), payment=(), usb=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
]

const nextConfig = {
  poweredByHeader: false,

  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },

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
