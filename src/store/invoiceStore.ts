import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { nanoid } from 'nanoid';

export type Token = 'ETH' | 'SOL' | 'USDC' | 'USDT';

export interface Invoice {
  id: string;
  clientName: string;
  serviceDescription: string;
  usdAmount: number;
  token: Token;
  recipientAddress: string;
  walletType: 'ethereum' | 'solana';
  status: 'pending' | 'paid';
  createdAt: number;
}

interface InvoiceStore {
  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, 'id' | 'status' | 'createdAt'>) => void;
  updateInvoiceStatus: (id: string, status: 'paid') => void;
  getInvoice: (id: string) => Invoice | undefined;
}

export const useInvoiceStore = create<InvoiceStore>()(
  persist(
    (set, get) => ({
      invoices: [],
      addInvoice: (invoice) =>
        set((state) => ({
          invoices: [
            ...state.invoices,
            {
              ...invoice,
              id: nanoid(),
              status: 'pending',
              createdAt: Date.now(),
            },
          ],
        })),
      updateInvoiceStatus: (id, status) =>
        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.id === id ? { ...inv, status } : inv
          ),
        })),
      getInvoice: (id) => {
        const state = get();
        return state.invoices.find((inv) => inv.id === id);
      },
    }),
    {
      name: 'invoice-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
); 