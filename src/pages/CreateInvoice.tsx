import { useState } from 'react';
import { WalletConnect } from '../components/WalletConnect';
import { InvoiceForm } from '../components/InvoiceForm';
import { Card, CardContent } from '../components/ui/card';

export const CreateInvoice = () => {
  const [recipientAddress, setRecipientAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<'ethereum' | 'solana' | null>(null);

  const handleWalletConnect = (address: string, chain: 'ethereum' | 'solana') => {
    setRecipientAddress(address);
    setWalletType(chain);
  };

  const handleWalletDisconnect = () => {
    setRecipientAddress(null);
    setWalletType(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-white dark:to-gray-300">
            Create New Invoice
          </h1>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Connect your wallet and fill in the details to create your invoice
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Wallet Connection Section */}
          <Card className="rounded-2xl shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Connect Your Wallet
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Choose your preferred wallet to continue
                  </p>
                </div>

                <WalletConnect 
                  onConnect={handleWalletConnect} 
                  onDisconnect={handleWalletDisconnect}
                />
              </div>
            </CardContent>
          </Card>

          {/* Invoice Form Section */}
          <Card className="rounded-2xl shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Invoice Details
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Fill in the details below to create your invoice
                  </p>
                </div>

                {recipientAddress && walletType ? (
                  <div className="transition-all duration-300 ease-in-out">
                    <InvoiceForm 
                      recipientAddress={recipientAddress} 
                      walletType={walletType}
                    />
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600 dark:text-gray-400">
                      Please connect your wallet to continue
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}; 