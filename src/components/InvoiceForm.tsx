import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvoiceStore } from '../store/invoiceStore';
import type { Token } from '../store/invoiceStore';

interface InvoiceFormProps {
  recipientAddress: string;
}

export const InvoiceForm = ({ recipientAddress }: InvoiceFormProps) => {
  const navigate = useNavigate();
  const addInvoice = useInvoiceStore((state) => state.addInvoice);
  const [formData, setFormData] = useState({
    clientName: '',
    serviceDescription: '',
    usdAmount: '',
    token: 'ETH' as Token,
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const usdAmount = parseFloat(formData.usdAmount);
      if (isNaN(usdAmount) || usdAmount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      const invoice = {
        clientName: formData.clientName,
        serviceDescription: formData.serviceDescription,
        usdAmount,
        token: formData.token,
        recipientAddress,
      };

      addInvoice(invoice);

      // Get the latest invoice from the store
      const invoices = useInvoiceStore.getState().invoices;
      const latestInvoice = invoices[invoices.length - 1];

      // Redirect to the invoice page using the invoice ID
      navigate(`/invoice/${latestInvoice.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
          <option value="ETH">ETH</option>
          <option value="SOL">SOL</option>
          <option value="USDC">USDC</option>
          <option value="USDT">USDT</option>
        </select>
      </div>

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      <button
        type="submit"
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Create Invoice
      </button>
    </form>
  );
}; 