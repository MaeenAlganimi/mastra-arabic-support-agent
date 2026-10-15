import type { Metadata } from 'next'
import { Fraunces, IBM_Plex_Sans_Arabic } from 'next/font/google'
import './globals.css'

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
})

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600'],
  variable: '--font-arabic',
})

export const metadata: Metadata = {
  title: 'بيت وردي · Bayt Wardi support',
  description: 'Bilingual Arabic and English customer-support agent template built with Mastra.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${display.variable} ${arabic.variable}`}>
      <body>{children}</body>
    </html>
  )
}
