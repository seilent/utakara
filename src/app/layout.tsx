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

// Start background jobs in production
if (process.env.NODE_ENV === 'production') {
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
