import type { Metadata } from 'next';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import Nav from '@/components/Nav';

export const metadata: Metadata = {
  title: 'Think Easy Agency',
  description: 'Professional promo agency tools with HR operations, design studio, client onboarding, and driver workflows.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full antialiased">
        <body className="min-h-full bg-slate-950 text-white">
          <Nav />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
