import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ethers } from 'ethers';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { db } from '../lib/firebase';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { CONTRACT_ADDRESS, NETWORKS, FEE_WALLET_ADDRESS } from '../constants/config';
import { usdToToken } from '../lib/usdToToken';

interface Invoice {
  clientName: string;
  serviceDescription: string;
  usdAmount: number;
  recipientAddress: string;
  token: 'ETH' | 'SOL';
  walletType: 'ethereum' | 'solana';
  status: 'pending' | 'paid' | 'failed';
  createdAt: any; // Firestore Timestamp
}

export const InvoiceDetails = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const updateInvoiceStatus = async (newStatus: 'paid' | 'pending' | 'failed') => {
    if (!invoiceId) return;
    
    try {
      const docRef = doc(db, 'invoices', invoiceId);
      await updateDoc(docRef, { status: newStatus });
    } catch (error) {
      console.error('Error updating invoice status:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (!invoiceId) {
      setError('No invoice ID provided');
      setIsLoading(false);
      return;
    }

    console.log('Starting to fetch invoice from Firestore...');
    console.log('Invoice ID to fetch:', invoiceId);

    // Set up real-time listener
    const docRef = doc(db, 'invoices', invoiceId);
    const unsubscribe = onSnapshot(
      docRef,
      (doc) => {
        if (doc.exists()) {
          console.log('Invoice data from Firestore:', doc.data());
          setInvoice(doc.data() as Invoice);
        } else {
          console.log('No invoice found in Firestore');
          setError('Invoice not found');
        }
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching invoice from Firestore:', error);
        setError('Error loading invoice: ' + error.message);
        setIsLoading(false);
      }
    );

    // Cleanup subscription
    return () => unsubscribe();
  }, [invoiceId]);

  if (isLoading) {
    return <div className="text-center p-4">Loading invoice...</div>;
  }

  if (error || !invoice) {
    return <div className="text-center p-4 text-red-500">{error || 'Invoice not found'}</div>;
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
      const recipientPublicKey = new PublicKey(invoice.recipientAddress);
      const feeWalletPublicKey = new PublicKey(FEE_WALLET_ADDRESS.SOLANA);
      
      // Calculate amounts in lamports
      const totalUsd = invoice.usdAmount + 1; // Total including fee
      const totalAmountStr = await usdToToken(totalUsd, invoice.token);
      const totalAmount = Number(totalAmountStr);
      
      // Calculate fee amount (1 USD in lamports)
      const feeAmountStr = await usdToToken(1, invoice.token);
      const feeAmount = Number(feeAmountStr);
      
      // Calculate recipient amount (total - fee)
      const recipientAmount = totalAmount - feeAmount;

      // Create transaction with two transfers
      const transaction = new Transaction().add(
        // Transfer to recipient
        SystemProgram.transfer({
          fromPubkey: phantom.publicKey,
          toPubkey: recipientPublicKey,
          lamports: recipientAmount,
        }),
        // Transfer fee to fee wallet
        SystemProgram.transfer({
          fromPubkey: phantom.publicKey,
          toPubkey: feeWalletPublicKey,
          lamports: feeAmount,
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

        console.log('Transaction successful:', {
          signature: signed.signature,
          recipientAmount: recipientAmount / 1e9, // Convert lamports to SOL
          feeAmount: feeAmount / 1e9, // Convert lamports to SOL
          totalAmount: totalAmount / 1e9 // Convert lamports to SOL
        });

        updateInvoiceStatus('paid');
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

      // Calculate fee and amount in wei using usdToToken
      const fee = await usdToToken(1, invoice.token); // $1 fee in wei
      const amount = await usdToToken(invoice.usdAmount, invoice.token); // invoice amount in wei
      const total = ethers.BigNumber.from(fee).add(ethers.BigNumber.from(amount));
      console.log('ETH payment debug:', {
        fee: ethers.utils.formatEther(fee),
        amount: ethers.utils.formatEther(amount),
        total: ethers.utils.formatEther(total),
        feeRaw: fee,
        amountRaw: amount,
        totalRaw: total.toString(),
      });

      try {
        // First check if the contract has the payInvoice function
        if (!contract.functions.payInvoice) {
          throw new Error('Contract does not have payInvoice function');
        }

        // Estimate gas first
        const gasEstimate = await contract.estimateGas.payInvoice(
          invoice.recipientAddress,
          fee,
          { value: total }
        );

        // Add 20% buffer to gas estimate
        const gasLimit = gasEstimate.mul(120).div(100);

        // Send payment with gas limit
        const tx = await contract.payInvoice(
          invoice.recipientAddress,
          fee,
          {
            value: total,
            gasLimit,
          }
        );

        await tx.wait();
        updateInvoiceStatus('paid');
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
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set('data', btoa(JSON.stringify(invoice)));
                navigator.clipboard.writeText(url.toString());
                alert('Invoice link copied to clipboard!');
              }}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 mb-4"
            >
              Copy Link
            </button>

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