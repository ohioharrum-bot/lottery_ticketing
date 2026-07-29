import { Poppins } from 'next/font/google'

export const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
})

// Note: Gilroy (display/headings) and Matter (numeric/tabular data) are licensed fonts.
// Drop the .woff2 files into /public/fonts/ (Gilroy-Bold.woff2, Gilroy-SemiBold.woff2,
// Matter-Medium.woff2, Matter-SemiBold.woff2). The @font-face declarations in globals.css
// pick them up automatically or next/font/local can be pointed to them once present.
// Until the actual font files are added to public/fonts/, typography falls back gracefully to Poppins.
