import { useState } from 'react';
import { WalletConnect } from '../components/WalletConnect';
import { InvoiceForm } from '../components/InvoiceForm';

export const CreateInvoice = () => {
  const [recipientAddress, setRecipientAddress] = useState<string | null>(null);

  const handleWalletConnect = (address: string) => {
    setRecipientAddress(address);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Create New Invoice
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Connect your wallet to start creating invoices
          </p>
        </div>

        <div className="mt-12">
          {!recipientAddress ? (
            <WalletConnect onConnect={handleWalletConnect} />
          ) : (
            <InvoiceForm recipientAddress={recipientAddress} />
          )}
        </div>
      </div>
    </div>
  );
}; 