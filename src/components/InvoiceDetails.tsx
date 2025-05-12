import { useState } from 'react';
import { ethers } from 'ethers';
import { useInvoiceStore } from '../store/invoiceStore';
import { QRCodeSVG } from 'qrcode.react';
import { CONTRACT_ADDRESS } from '../constants/config';

interface InvoiceDetailsProps {
  invoiceId: string;
}

// Define the contract ABI type
type ContractABI = Array<{
  inputs: Array<{ name: string; type: string }>;
  name: string;
  outputs: Array<{ name: string; type: string }>;
  stateMutability: string;
  type: string;
}>;

export const InvoiceDetails = ({ invoiceId }: InvoiceDetailsProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const invoice = useInvoiceStore((state) => state.getInvoice(invoiceId));
  const updateInvoiceStatus = useInvoiceStore((state) => state.updateInvoiceStatus);

  if (!invoice) {
    return <div className="text-center p-4">Invoice not found</div>;
  }

  const handlePayment = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      if (!window.ethereum) {
        throw new Error('Please install MetaMask to make payments');
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      // Get contract ABI from deployment.json
      const response = await fetch('/src/contracts/deployment.json');
      const { abi } = await response.json();

      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

      // Calculate total amount including $1 fee
      const totalAmount = ethers.utils.parseEther((invoice.usdAmount + 1).toString());

      try {
        // First check if the contract has the payInvoice function
        if (!contract.functions.payInvoice) {
          throw new Error('Contract does not have payInvoice function');
        }

        // Estimate gas first
        const gasEstimate = await contract.estimateGas.payInvoice(invoice.recipientAddress, {
          value: totalAmount,
        });

        // Add 20% buffer to gas estimate
        const gasLimit = gasEstimate.mul(120).div(100);

        // Send payment with gas limit
        const tx = await contract.payInvoice(invoice.recipientAddress, {
          value: totalAmount,
          gasLimit,
        });

        await tx.wait();
        updateInvoiceStatus(invoiceId, 'paid');
      } catch (contractError: any) {
        if (contractError.code === 'INSUFFICIENT_FUNDS') {
          throw new Error('Insufficient funds to cover the payment and gas fees');
        }
        throw contractError;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Invoice Details</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Client Name</h3>
            <p className="mt-1">{invoice.clientName}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Service Description</h3>
            <p className="mt-1">{invoice.serviceDescription}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Amount</h3>
            <p className="mt-1">${invoice.usdAmount} USD</p>
            <p className="text-sm text-gray-500">+ $1 processing fee</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Payment Token</h3>
            <p className="mt-1">{invoice.token}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Status</h3>
            <p className={`mt-1 ${invoice.status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
              {invoice.status.toUpperCase()}
            </p>
          </div>
        </div>

        {invoice.status === 'pending' && (
          <div className="mt-6">
            <div className="flex justify-center mb-4">
              <QRCodeSVG
                value={`ethereum:${CONTRACT_ADDRESS}?value=${invoice.usdAmount + 1}`}
                size={200}
              />
            </div>

            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isProcessing ? 'Processing...' : 'Pay Invoice'}
            </button>

            {error && (
              <p className="mt-2 text-red-500 text-sm text-center">{error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 