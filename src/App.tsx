import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CreateInvoice } from './pages/CreateInvoice';
import { InvoicePage } from './pages/InvoicePage';
import { LandingPage } from './pages/LandingPage';
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/create" element={<CreateInvoice />} />
        <Route path="/invoice/:invoiceId" element={<InvoicePage />} />
      </Routes>
    </Router>
  );
}

export default App;
