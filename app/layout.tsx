import type { Metadata } from 'next';
import './globals.css';
import { WalletProvider } from '@/components/WalletProvider';
import Navigation from '@/components/Navigation';

export const metadata: Metadata = {
  title: 'FairDeal - Decentralized Freelancing Platform',
  description: 'Trustless escrow marketplace on Stellar blockchain',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          <div className="App">
            <div className="bg-blob blob-1"></div>
            <div className="bg-blob blob-2"></div>
            <Navigation />
            {children}
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}
