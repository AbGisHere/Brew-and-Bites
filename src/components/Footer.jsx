import { useEffect, useState } from 'react';

export default function Footer() {
  const [version, setVersion] = useState('1.4.1');

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const response = await fetch('/api/version');
        if (response.ok) {
          const data = await response.json();
          setVersion(data.version);
        }
      } catch (error) {
        console.error('Error fetching version:', error);
      }
    };

    fetchVersion();
  }, []);

  return (
    <footer className="bg-amber-900 text-amber-50 py-12 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-4 text-center md:text-left">
          <h3 className="text-2xl font-bold text-amber-100 font-serif">Brew & Bites</h3>
          <p className="text-amber-100">Craft coffee, fresh bites, and cozy vibes in the heart of town.</p>
        </div>

        <div className="space-y-4 text-center">
          <h4 className="text-lg font-semibold text-amber-100 font-serif">Hours</h4>
          <ul className="space-y-2">
            <li className="flex justify-between max-w-xs mx-auto">
              <span className="text-amber-100">Mon - Fri</span>
              <span className="text-amber-50">7:00 AM - 8:00 PM</span>
            </li>
            <li className="flex justify-between max-w-xs mx-auto">
              <span className="text-amber-100">Sat - Sun</span>
              <span className="text-amber-50">8:00 AM - 9:00 PM</span>
            </li>
          </ul>
        </div>

        <div className="space-y-4 text-center md:text-right">
          <h4 className="text-lg font-semibold text-amber-100 font-serif">Location</h4>
          <address className="not-italic text-amber-50">
            <p className="mb-1">123 Coffee Street</p>
            <p>Brewtown, CA 90210</p>
          </address>
        </div>
      </div>

      <div className="border-t border-amber-700 mt-12 pt-8">
        <div className="flex flex-col items-center space-y-4">
          <p className="text-sm text-amber-100">
            © {new Date().getFullYear()} Brew & Bites. All rights reserved.
          </p>
          
          <div className="flex flex-col items-center space-y-2">
            <a 
              href="https://github.com/AbGisHere/Brew-and-Bites"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative mb-2"
              aria-label="GitHub Repository"
            >
              <button className="focus:outline-none hover:scale-110 transition-transform duration-200" aria-label="View on GitHub">
                <svg 
                  strokeLinejoin="round" 
                  strokeLinecap="round" 
                  strokeWidth="2" 
                  stroke="currentColor" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  className="w-8 h-8 text-amber-100 hover:text-amber-50 transition-colors duration-200"
                >
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                </svg>
              </button>
            </a>
            
            <div className="flex items-center space-x-1 text-sm text-amber-100">
              <span>v{version}</span>
              <span className="opacity-50 px-1">•</span>
              <span>Made with <span className="text-red-300">♥</span> by <span className="font-medium text-amber-50 hover:text-white transition-colors duration-200">AbG</span></span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
