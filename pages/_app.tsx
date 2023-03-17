import type { AppProps } from 'next/app'
import { Analytics } from '@vercel/analytics/react'


import '@vercel/examples-ui/globals.css'

function App({ Component, pageProps }: AppProps) {


  return (
  
      <Component {...pageProps} />
      <Analytics />
  
  )
}

export default App
