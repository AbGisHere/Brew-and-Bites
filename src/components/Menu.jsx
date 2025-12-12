import { useMemo, useState, useEffect } from 'react';
// REMOVED: import { store } from '../store'; 
import API_URL from '../config'; // <--- 1. IMPORT THIS

export default function Menu() {
  const [menu, setMenu] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Calculate categories based on the loaded menu data
  const categories = useMemo(() => Object.keys(menu).filter(cat => menu[cat].length > 0), [menu]);
  const [activeCategory, setActiveCategory] = useState('');

  // 1. Fetch data from Server on mount
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        // 2. USE THE API_URL VARIABLE (Note the backticks ` `)
        const response = await fetch(`${API_URL}/api/menu`);
        
        if (!response.ok) throw new Error('Failed to fetch menu');
        
        const data = await response.json();
        
        // 2. Transform the Flat List from Server into Grouped Categories
        const groupedMenu = data.reduce((acc, item) => {
          // Optional: Only show featured items to match previous behavior
          if (item.featured) { 
            const cat = item.category || 'Uncategorized';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(item);
          }
          return acc;
        }, {});

        setMenu(groupedMenu);
        setIsLoading(false);
      } catch (err) {
        console.error("Error loading menu:", err);
        setError("Could not load menu. Please try again later.");
        setIsLoading(false);
      }
    };

    fetchMenu();
  }, []);

  // Update active category if current one becomes empty or on first load
  useEffect(() => {
    if (categories.length > 0 && !categories.includes(activeCategory)) {
      setActiveCategory(categories[0]);
    } else if (categories.length === 0) {
      setActiveCategory('');
    }
  }, [categories, activeCategory]);

  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <div className="text-xl font-semibold text-gray-600">Loading delicious items...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center text-red-600">
        {error}
      </div>
    );
  }

  return (
    <section id="menu" className="py-12 md:py-20 bg-opacity-90">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Our Menu</h2>
          <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
          <p className="text-gray-700 max-w-2xl mx-auto text-lg">
            We carefully select the finest ingredients to create delicious and healthy meals for you.
          </p>
        </div>

        {/* Menu Categories */}
        <div className="flex flex-wrap justify-center mb-12 gap-2">
          {categories.length > 0 ? (
            categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-6 py-2 rounded-full font-medium transition-colors ${
                  activeCategory === category
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))
          ) : (
            <div className="text-gray-500 py-4">No featured categories available</div>
          )}
        </div>

        {/* Menu Items (flip cards) */}
        <div className="menu-cards grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 lg:gap-10 px-4 sm:px-0">
          {activeCategory && menu[activeCategory]?.length > 0 ? (
            menu[activeCategory].map((item, index) => (
              <div key={`${activeCategory}-${index}`} className="card w-full h-64 md:h-72 lg:h-80">
                <div className="content">
                  <div className="front">
                    <div className="img">
                      <div className="circle"></div>
                      <div className="circle" id="right"></div>
                      <div className="circle" id="bottom"></div>
                    </div>
                    <div className="front-content flex flex-col items-center justify-center h-full p-4">
                      <h3 className="text-xl font-bold mb-2">{item.name}</h3>
                      <p className="text-gray-300 text-sm mb-4 text-center">{item.description}</p>
                      <div className="text-gray-200 font-semibold text-lg">₹{Number(item.price).toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="back">
                    <div className="back-content flex items-center justify-center h-full">
                      <h3 className="text-xl font-bold text-white text-center px-2">{item.name}</h3>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500">
              No featured dishes in this category. Please check back later.
            </div>
          )}
        </div>

        <div className="text-center mt-16">
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-primary hover:bg-opacity-90 text-white font-semibold py-3 px-8 rounded-full transition-all transform hover:scale-105 text-lg"
          >
            Back to Top
          </button>
        </div>
      </div>
    </section>
  );
}