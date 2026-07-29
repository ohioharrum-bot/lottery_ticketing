import type { Metadata } from 'next'
import { poppins } from './fonts'
import './globals.css'

export const metadata: Metadata = {
  title: 'Lottery Ticketing Dashboard',
  description: 'Lottery POS and Shift Management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={poppins.variable} suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}