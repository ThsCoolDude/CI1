import { useState } from 'react';
import { ethers } from 'ethers';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { useInvoiceStore } from '../store/invoiceStore';
import { QRCodeSVG } from 'qrcode.react';
import { CONTRACT_ADDRESS, NETWORKS } from '../constants/config';
import { usdToToken } from '../lib/usdToToken';

interface InvoiceDetailsProps {
  invoiceId: string;
}

export const InvoiceDetails = ({ invoiceId }: InvoiceDetailsProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const invoice = useInvoiceStore((state) => state.getInvoice(invoiceId));
  const updateInvoiceStatus = useInvoiceStore((state) => state.updateInvoiceStatus);

  if (!invoice) {
    return <div className="text-center p-4">Invoice not found</div>;
  }

  const handleSolanaPayment = async () => {
    try {
      if (!window.solana) {
        throw new Error('Please install Phantom wallet to make payments');
      }

      // Ensure we're connected to Phantom
      const phantom = window.solana as any;
      if (!phantom.isConnected) {
        await phantom.connect();
      }

      // Ensure we're on devnet
      const connection = new Connection(NETWORKS.SOLANA.DEVNET.endpoint);
      const publicKey = new PublicKey(invoice.recipientAddress);
      
      // Calculate total amount in lamports using usdToToken
      const totalUsd = invoice.usdAmount + 1;
      const totalAmountStr = await usdToToken(totalUsd, invoice.token); // returns string
      const totalAmount = Number(totalAmountStr);

      // Create transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: phantom.publicKey,
          toPubkey: publicKey,
          lamports: totalAmount,
        })
      );

      // Get latest blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = phantom.publicKey;

      try {
        // Sign and send transaction
        const signed = await phantom.signAndSendTransaction(transaction);
        
        // Wait for confirmation with timeout
        const confirmation = await connection.confirmTransaction({
          signature: signed.signature,
          blockhash: blockhash,
          lastValidBlockHeight: lastValidBlockHeight
        });

        if (confirmation.value.err) {
          throw new Error('Transaction failed: ' + confirmation.value.err);
        }

        updateInvoiceStatus(invoiceId, 'paid');
      } catch (err) {
        console.error('Transaction error:', err);
        throw new Error('Failed to send transaction: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    }
  };

  const handleEthereumPayment = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask to make payments');
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      // Ensure we're on Sepolia
      const network = await provider.getNetwork();
      if (network.chainId !== parseInt(NETWORKS.ETHEREUM.SEPOLIA.chainId, 16)) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: NETWORKS.ETHEREUM.SEPOLIA.chainId }],
          });
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: NETWORKS.ETHEREUM.SEPOLIA.chainId,
                chainName: NETWORKS.ETHEREUM.SEPOLIA.chainName,
                rpcUrls: [NETWORKS.ETHEREUM.SEPOLIA.rpcUrl],
                blockExplorerUrls: [NETWORKS.ETHEREUM.SEPOLIA.blockExplorerUrl],
              }],
            });
          } else {
            throw switchError;
          }
        }
      }

      // Get contract ABI from deployment.json
      const response = await fetch('/src/contracts/deployment.json');
      const { abi } = await response.json();

      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

      // Calculate total amount in wei using usdToToken
      const totalUsd = invoice.usdAmount + 1;
      const totalAmount = await usdToToken(totalUsd, invoice.token); // returns string

      try {
        // First check if the contract has the payInvoice function
        if (!contract.functions.payInvoice) {
          throw new Error('Contract does not have payInvoice function');
        }

        // Estimate gas first
        const gasEstimate = await contract.estimateGas.payInvoice(invoice.recipientAddress, {
          value: ethers.BigNumber.from(totalAmount),
        });

        // Add 20% buffer to gas estimate
        const gasLimit = gasEstimate.mul(120).div(100);

        // Send payment with gas limit
        const tx = await contract.payInvoice(invoice.recipientAddress, {
          value: ethers.BigNumber.from(totalAmount),
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
    }
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      if (invoice.walletType === 'ethereum') {
        await handleEthereumPayment();
      } else if (invoice.walletType === 'solana') {
        await handleSolanaPayment();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const getQRCodeValue = () => {
    if (invoice.walletType === 'ethereum') {
      return `ethereum:${CONTRACT_ADDRESS}?value=${invoice.usdAmount + 1}`;
    } else {
      return `solana:${invoice.recipientAddress}?amount=${invoice.usdAmount + 1}`;
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
                value={getQRCodeValue()}
                size={200}
              />
            </div>

            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isProcessing ? 'Processing...' : `Pay with ${invoice.walletType === 'ethereum' ? 'MetaMask' : 'Phantom'}`}
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