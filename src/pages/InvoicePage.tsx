import { useParams } from 'react-router-dom';
import { InvoiceDetails } from '../components/InvoiceDetails';

export const InvoicePage = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();

  if (!invoiceId) {
    return <div className="text-center p-4">Invalid invoice ID</div>;
  }

  return (
    <div className="py-4">
      <div className="max-w-2xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="mt-4">
          <InvoiceDetails />
        </div>
      </div>
    </div>
  );
}; 