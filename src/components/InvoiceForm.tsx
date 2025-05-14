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
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-6 space-y-6">
      <div>
        <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">
          Client Name
        </label>
        <input
          type="text"
          id="clientName"
          name="clientName"
          value={formData.clientName}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="serviceDescription" className="block text-sm font-medium text-gray-700">
          Service Description
        </label>
        <textarea
          id="serviceDescription"
          name="serviceDescription"
          value={formData.serviceDescription}
          onChange={handleChange}
          required
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="usdAmount" className="block text-sm font-medium text-gray-700">
          Amount (USD)
        </label>
        <input
          type="number"
          id="usdAmount"
          name="usdAmount"
          value={formData.usdAmount}
          onChange={handleChange}
          required
          min="0"
          step="0.01"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="token" className="block text-sm font-medium text-gray-700">
          Payment Token
        </label>
        <select
          id="token"
          name="token"
          value={formData.token}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          {getAvailableTokens().map((token) => (
            <option key={token} value={token}>
              {token}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {isSubmitting ? 'Creating Invoice...' : 'Create Invoice'}
      </button>
    </form>
  );
}; 