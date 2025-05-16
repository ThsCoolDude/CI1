import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

type Token = 'ETH' | 'SOL' | 'USDC' | 'USDT';

interface InvoiceFormProps {
  recipientAddress: string;
  walletType: 'ethereum' | 'solana';
  onInvoiceCreated?: (invoice: any) => void;
}

export const InvoiceForm = ({ recipientAddress, walletType, onInvoiceCreated }: InvoiceFormProps) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    clientName: '',
    serviceDescription: '',
    usdAmount: '',
    token: walletType === 'ethereum' ? 'ETH' : 'SOL' as Token,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const usdAmount = parseFloat(formData.usdAmount);
      if (isNaN(usdAmount) || usdAmount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      const invoiceData = {
        clientName: formData.clientName,
        serviceDescription: formData.serviceDescription,
        usdAmount,
        token: formData.token,
        recipientAddress,
        walletType,
        status: 'pending',
        createdAt: serverTimestamp(),
      };

      // Save to Firestore
      const docRef = await addDoc(collection(db, 'invoices'), invoiceData);
      console.log('Invoice created with ID:', docRef.id);

      if (onInvoiceCreated) {
        onInvoiceCreated({ ...invoiceData, id: docRef.id });
      } else {
        // Navigate to the invoice page using the Firestore document ID
        navigate(`/invoice/${docRef.id}`);
      }
    } catch (err) {
      console.error('Error creating invoice:', err);
      setError(err instanceof Error ? err.message : 'Failed to create invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getAvailableTokens = () => {
    const commonTokens = ['USDC', 'USDT'];
    const chainSpecificToken = walletType === 'ethereum' ? 'ETH' : 'SOL';
    return [chainSpecificToken, ...commonTokens];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Client Name
          </label>
          <input
            type="text"
            id="clientName"
            name="clientName"
            value={formData.clientName}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-xl border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white focus:text-gray-900 dark:focus:text-white transition-colors duration-200 pl-3"
            placeholder="Enter client name"
          />
        </div>

        <div>
          <label htmlFor="serviceDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Service Description
          </label>
          <textarea
            id="serviceDescription"
            name="serviceDescription"
            value={formData.serviceDescription}
            onChange={handleChange}
            required
            rows={3}
            className="mt-1 block w-full rounded-xl border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white focus:text-gray-900 dark:focus:text-white transition-colors duration-200 pl-3"
            placeholder="Describe the service or product"
          />
        </div>

        <div>
          <label htmlFor="usdAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Amount (USD)
          </label>
          <div className="mt-1 relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 dark:text-gray-400 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              id="usdAmount"
              name="usdAmount"
              value={formData.usdAmount}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="block w-full pl-7 pr-12 rounded-xl border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white focus:text-gray-900 dark:focus:text-white transition-colors duration-200"
              placeholder="0.00"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 dark:text-gray-400 sm:text-sm">USD</span>
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">+ $1 processing fee</p>
        </div>

        <div>
          <label htmlFor="token" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Payment Token
          </label>
          <select
            id="token"
            name="token"
            value={formData.token}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-xl border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
          >
            {getAvailableTokens().map((token) => (
              <option key={token} value={token}>
                {token}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-300"
      >
        {isSubmitting ? 'Creating Invoice...' : 'Create Invoice'}
      </button>
    </form>
  );
}; 