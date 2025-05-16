import { Link } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Switch } from "../components/ui/switch";
import { useEffect, useState } from 'react';

export const LandingPage = () => {
  // Dark mode toggle logic
  const getSystemTheme = () => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  };

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return getSystemTheme();
    }
    return false;
  });

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full mb-24">
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

          {/* Supported Cryptocurrencies */}
          <div className="w-full max-w-5xl mb-24">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">Supported Cryptocurrencies</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { 
                  name: 'ETH', 
                  image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png?1696501628',
                  fallback: 'Ξ'
                },
                { 
                  name: 'SOL', 
                  image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png?1696504756',
                  fallback: '◎'
                },
                { 
                  name: 'USDC', 
                  image: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1696506509',
                  fallback: '₮'
                },
                { 
                  name: 'USDT', 
                  image: 'https://assets.coingecko.com/coins/images/325/large/Tether.png?1696501661',
                  fallback: '₮'
                }
              ].map((coin) => (
                <div key={coin.name} className="flex flex-col items-center p-6 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="w-20 h-20 mb-4 flex items-center justify-center">
                    <img 
                      src={coin.image} 
                      alt={coin.name} 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = document.createElement('div');
                        fallback.className = 'text-4xl font-bold text-gray-900 dark:text-white';
                        fallback.textContent = coin.fallback;
                        target.parentNode?.appendChild(fallback);
                      }}
                    />
                  </div>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">{coin.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonials Section */}
          <div className="w-full max-w-5xl mb-24">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">What Our Users Say</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: "Sarah Johnson",
                  role: "Freelance Developer",
                  content: "CryptoInvoice has revolutionized how I handle payments. The $1 fee is unbeatable, and the real-time tracking is a game-changer.",
                  avatar: "👩‍💻"
                },
                {
                  name: "Michael Chen",
                  role: "Digital Artist",
                  content: "As someone who works with international clients, this platform has made crypto payments so much easier. Highly recommended!",
                  avatar: "🎨"
                },
                {
                  name: "Alex Rodriguez",
                  role: "Crypto Consultant",
                  content: "The best crypto invoicing solution I've used. Simple, secure, and professional. Perfect for my consulting business.",
                  avatar: "👨‍💼"
                }
              ].map((testimonial, index) => (
                <Card key={index} className="rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <CardContent className="p-8">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-2xl mr-4">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">{testimonial.name}</h3>
                        <p className="text-gray-600 dark:text-gray-400">{testimonial.role}</p>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-lg italic">"{testimonial.content}"</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="w-full max-w-5xl mb-24">
            <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 p-12 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
              <p className="text-xl text-blue-100 mb-8">Create your first crypto invoice in less than a minute.</p>
              <Link to="/create">
                <Button size="xl" className="text-xl font-bold px-12 py-6 bg-white text-blue-600 hover:bg-blue-50 transition-all duration-300">
                  Create Invoice Now
                </Button>
              </Link>
            </div>
          </div>

          {/* Footer */}
          <footer className="w-full max-w-5xl py-12 border-t border-gray-200 dark:border-gray-800">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-600 dark:text-gray-400 mb-4 md:mb-0">
                © 2025 CryptoInvoice. All rights reserved.
              </div>
              <div className="flex space-x-6">
                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Terms</a>
                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Privacy</a>
                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Contact</a>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}; 