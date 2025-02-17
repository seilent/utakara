'use client';

import { SessionProvider } from 'next-auth/react';
import { PropsWithChildren } from 'react';

export function NextAuthProvider({ children }: PropsWithChildren) {
  // Add event listener for auth errors
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.message?.includes('fetch failed')) {
        console.error('NextAuth fetch error:', event.reason);
      }
    });
  }

  return (
    <SessionProvider 
      refetchInterval={0} 
      refetchOnWindowFocus={false}
    >
      {children}
    </SessionProvider>
  );
}