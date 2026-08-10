import type { Metadata } from 'next';
import './globals.css';
import Nav from '@/components/Nav';

export const metadata: Metadata = {
  title: 'Think Easy Agency',
  description: 'Professional promo agency tools: Wrap Lab, Billboard Lab, Driver Portal.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-slate-950 text-white">
        <Nav />
        {children}
      </body>
    </html>
  );
}
