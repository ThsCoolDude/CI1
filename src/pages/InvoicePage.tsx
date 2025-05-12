import { useParams } from 'react-router-dom';
import { InvoiceDetails } from '../components/InvoiceDetails';

export const InvoicePage = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();

  if (!invoiceId) {
    return <div className="text-center p-4">Invalid invoice ID</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Invoice Details
          </h1>
        </div>

        <div className="mt-12">
          <InvoiceDetails invoiceId={invoiceId} />
        </div>
      </div>
    </div>
  );
}; 