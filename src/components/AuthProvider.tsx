'use client';

import { PropsWithChildren } from 'react';

export function AuthProvider({ children }: PropsWithChildren) {
  // Add error handling for fetch failures
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.message?.includes('fetch failed')) {
        console.error('Auth fetch error:', event.reason);
      }
    });
  }

  return children;
}