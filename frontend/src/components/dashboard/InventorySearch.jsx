import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

export default function InventorySearch({ searchQuery, setSearchQuery, inventory = [] }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const searchRef = useRef(null);

  // Generate suggestions based on query
  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      
      // Get unique item names and categories that match
      const uniqueSuggestions = new Set();
      
      inventory.forEach(item => {
        if (item.name.toLowerCase().includes(query)) {
          uniqueSuggestions.add(item.name);
        }
        if (item.category.toLowerCase().includes(query)) {
          const categoryLabel = item.category.charAt(0).toUpperCase() + item.category.slice(1);
          uniqueSuggestions.add(`Category: ${categoryLabel}`);
        }
      });

      // Convert set to array and limit to 6 suggestions
      setSuggestions(Array.from(uniqueSuggestions).slice(0, 6));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, inventory]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (suggestion) => {
    // Remove "Category: " prefix if present
    const cleanSuggestion = suggestion.replace('Category: ', '');
    setSearchQuery(cleanSuggestion);
    setShowSuggestions(false);
  };

  return (
    <div className="relative mb-6" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search items by name or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery && setSuggestions.length > 0 && setShowSuggestions(true)}
          className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              setShowSuggestions(false);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="max-h-64 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-purple-50 transition flex items-center gap-2 border-b last:border-b-0"
              >
                <Search className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{suggestion}</span>
                <span className="text-xs text-gray-500 ml-auto">
                  {suggestion.includes('Category:') 
                    ? `${inventory.filter(item => 
                        item.category.toLowerCase().includes(suggestion.replace('Category: ', '').toLowerCase())
                      ).length} items`
                    : `${inventory.filter(item => 
                        item.name.toLowerCase().includes(suggestion.toLowerCase())
                      ).length} match`
                  }
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
