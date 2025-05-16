import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ethers } from 'ethers';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { db } from '../lib/firebase';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { CONTRACT_ADDRESS, NETWORKS, FEE_WALLET_ADDRESS } from '../constants/config';
import { usdToToken } from '../lib/usdToToken';
import { Card, CardContent } from './ui/card';

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
    <div className="flex justify-center items-center min-h-[60vh]">
      <Card className="w-full max-w-3xl mx-auto rounded-2xl shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0">
        <CardContent className="p-8">
          <h2 className="text-3xl font-extrabold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-white dark:to-gray-300">Invoice Details</h2>
          <div className="flex flex-col md:flex-row gap-10">
            {/* Left: Invoice Details */}
            <div className="md:w-1/2 space-y-6 flex flex-col justify-center">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Client Name</h3>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{invoice.clientName}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Service Description</h3>
                <p className="mt-1 text-gray-700 dark:text-gray-200">{invoice.serviceDescription}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Amount</h3>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">${invoice.usdAmount} USD</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">+ $1 processing fee</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment Token</h3>
                <p className="mt-1 text-gray-700 dark:text-gray-200">{invoice.token}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</h3>
                <p className={`mt-1 text-base font-bold ${invoice.status === 'paid' ? 'text-green-600 dark:text-green-400' : invoice.status === 'failed' ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`}>{invoice.status.toUpperCase()}</p>
              </div>
            </div>
            {/* Right: QR and Actions */}
            <div className="md:w-1/2 flex flex-col items-center justify-center">
              {invoice.status === 'pending' && (
                <>
                  <QRCodeSVG
                    value={getQRCodeValue()}
                    size={180}
                    className="rounded-xl shadow-md bg-white p-2 dark:bg-gray-900"
                  />
                  <span className="mt-2 text-xs text-gray-500 dark:text-gray-400">Scan to pay</span>
                  <button
                    onClick={() => {
                      const url = new URL(window.location.href);
                      url.searchParams.set('data', btoa(JSON.stringify(invoice)));
                      navigator.clipboard.writeText(url.toString());
                      alert('Invoice link copied to clipboard!');
                    }}
                    className="w-full mt-6 flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 mb-4 transition-all duration-300"
                  >
                    Copy Link
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-300"
                  >
                    {isProcessing ? 'Processing...' : `Pay with ${invoice.walletType === 'ethereum' ? 'MetaMask' : 'Phantom'}`}
                  </button>
                  {error && (
                    <p className="mt-2 text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
                  )}
                </>
              )}
              {invoice.status !== 'pending' && (
                <div className="flex flex-col items-center justify-center h-full">
                  <QRCodeSVG
                    value={getQRCodeValue()}
                    size={180}
                    className="rounded-xl shadow-md bg-white p-2 dark:bg-gray-900 opacity-50"
                  />
                  <span className="mt-2 text-xs text-gray-400 dark:text-gray-500">Payment complete</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 