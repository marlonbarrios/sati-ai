import type { AppProps } from 'next/app';
import { Analytics } from '@vercel/analytics/react';
import type { LayoutProps } from '@vercel/examples-ui/layout';
import {Home} from 'Home';
import type  {Head}from 'next/head'

import { getLayout } from '@vercel/examples-ui';

import '@vercel/examples-ui/globals.css';


function App({ Component, pageProps }: AppProps) {
  return (
   
    <Home>
       <Head>
        <title>Bhikkh-AI</title>
      </Head>
      <Component {...pageProps} />
      <Analytics />
    </Home>
  );
}

export default App;
