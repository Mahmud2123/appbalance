import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Apple Balance - Check Your Balance',
  description: 'Check your Apple Gift Card balance instantly. Secure verification for Apple Gift Cards.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  )
}