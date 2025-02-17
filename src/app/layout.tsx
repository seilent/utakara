import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NextAuthProvider } from '@/components/NextAuthProvider';
import { startCleanupJob } from '@/lib/audio-cleanup';
import { startDiskSpaceMonitoring } from '@/lib/disk-monitor';
import { join } from 'path';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Prevent background jobs from running during auth or API routes
if (process.env.NODE_ENV === 'production' && 
    !process.env.NEXT_RUNTIME && 
    typeof window === 'undefined') {
  startCleanupJob();
  startDiskSpaceMonitoring(join(process.cwd(), 'music'));
}

export const metadata: Metadata = {
  title: "Utakara",
  description: "Personal Japanese song lyrics manager",
  icons: {
    icon: [
      {
        url: "/favicon.svg",
        type: "image/svg+xml",
      }
    ]
  }
};

// Global error handling
function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="text-lg font-semibold">Something went wrong!</h2>
            <button
              className="mt-4 rounded-md bg-blue-500 px-4 py-2 text-white"
              onClick={() => reset()}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}

export { GlobalError };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextAuthProvider>
          {children}
        </NextAuthProvider>
      </body>
    </html>
  );
}
