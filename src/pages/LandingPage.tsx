import { Link } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Switch } from "../components/ui/switch";
import { useEffect, useState } from 'react';

export const LandingPage = () => {
  // Dark mode toggle logic
  const [darkMode, setDarkMode] = useState(() =>
    typeof window !== 'undefined'
      ? document.documentElement.classList.contains('dark')
      : false
  );

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen w-full relative">
      {/* Background with gradient and pattern */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-100 via-indigo-100 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-500">
        <div className="absolute inset-0 opacity-10 dark:opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAzNGMwIDIuMjA5LTEuNzkxIDQtNCA0cy00LTEuNzkxLTQtNCAxLjc5MS00IDQtNCA0IDEuNzkxIDQgNHoiIGZpbGw9IiMwMDAiLz48L2c+PC9zdmc+')]"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
          <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-white dark:to-gray-300">
            CryptoInvoice
          </span>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Switch id="theme-toggle" checked={darkMode} onCheckedChange={setDarkMode} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{darkMode ? 'Dark' : 'Light'}</span>
            </div>
            <Link to="/create">
              <Button size="lg" className="font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                Create Invoice
              </Button>
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="flex flex-col items-center justify-center text-center px-4 py-20">
          <div className="max-w-4xl mx-auto mb-16">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-white dark:to-gray-300 leading-tight">
              Create Crypto Invoices for Free
              <span className="block text-3xl sm:text-4xl md:text-5xl mt-2 text-gray-700 dark:text-gray-300">
                Only $1 Fee
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
              Send and track invoices in ETH, SOL, USDC, and USDT. Simple, fast, and secure.
            </p>
            <Link to="/create">
              <Button size="xl" className="text-xl font-bold px-12 py-6 shadow-xl hover:shadow-2xl transition-all duration-300">
                Create Your First Invoice
              </Button>
            </Link>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
            <Card className="rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center p-10">
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6">
                  <span className="text-4xl">⚡</span>
                </div>
                <h2 className="font-bold text-2xl mb-4 text-gray-900 dark:text-white">Send Invoices Instantly</h2>
                <p className="text-gray-600 dark:text-gray-300 text-lg">Create and send invoices in seconds. No account required.</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center p-10">
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6">
                  <span className="text-4xl">🔔</span>
                </div>
                <h2 className="font-bold text-2xl mb-4 text-gray-900 dark:text-white">Track Payments in Real-Time</h2>
                <p className="text-gray-600 dark:text-gray-300 text-lg">Get instant notifications when your invoice is paid.</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center p-10">
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6">
                  <span className="text-4xl">🛡️</span>
                </div>
                <h2 className="font-bold text-2xl mb-4 text-gray-900 dark:text-white">Secure & Low Fee</h2>
                <p className="text-gray-600 dark:text-gray-300 text-lg">Only $1 fee per invoice. Your data and funds are always safe.</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}; 