import type { Metadata } from 'next';
import { Syne } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/lib/cart';

const syne = Syne({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-syne',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PrintMate AI — Custom Print-on-Demand, Designed by You',
  description:
    'Design custom tees, hoodies, mugs, posters and stickers. We route every order to the nearest local print partner.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={syne.variable}>
      <body className="bg-ink text-zinc-100 font-sans antialiased min-h-screen">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
