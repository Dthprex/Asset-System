import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'cosmetics.lk IT Portal | Enterprise Fleet & Custody Lifecycle',
  description:
    'Dedicated IT hardware procurement, warranty management, showroom deployment, temporary loan custody, dual IMEI tracking, and return damage inspection system for cosmetics.lk.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-screen bg-[#fbfcfe] text-slate-800 selection:bg-rose-100 selection:text-rose-900">
        {children}
      </body>
    </html>
  );
}
