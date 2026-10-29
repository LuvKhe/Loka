import type { Metadata, Viewport } from 'next'
import './globals.css'
import PersistStorage from '@/components/ui/PersistStorage'
import ThemeSync from '@/components/ui/ThemeSync'

export const metadata: Metadata = {
  title: 'Loka',
  description: 'Know where your friends are on campus.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-192.png', sizes: '192x192', type: 'image/png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon-dark-512.png', sizes: '512x512', type: 'image/png', media: '(prefers-color-scheme: dark)' },
    ],
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Loka',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2563EB' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('loka-theme');var m=window.matchMedia('(prefers-color-scheme: dark)').matches;var d=t==='dark'||((t==null||t==='system')&&m);var h=document.documentElement;h.classList.toggle('dark',d);h.style.colorScheme=d?'dark':'light'}catch(e){}})()",
          }}
        />
      </head>
      <body className="min-h-screen bg-gray-50 dark:bg-black">
        <PersistStorage />
        <ThemeSync />
        {children}
      </body>
    </html>
  )
}
