"use client";

import type { AppProps } from 'next/app';
import '../app/globals.css';
import { SupabaseProvider } from '../context/SupabaseContext';
import { AppProvider } from '../context/AppContext';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <SupabaseProvider>
      <AppProvider>
        <Component {...pageProps} />
      </AppProvider>
    </SupabaseProvider>
  );
}


