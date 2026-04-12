import { Filter, X } from 'lucide-react';

export default function FilterSidebar({ showFilters, setShowFilters, selectedCategory, setSelectedCategory, selectedPrice, setSelectedPrice }) {
  return (
    <div className={`${showFilters ? 'block' : 'hidden'} lg:block lg:w-64 flex-shrink-0`}>
      <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
        <div className="flex justify-between items-center mb-6 lg:hidden">
          <h2 className="text-xl font-bold text-gray-900">Filters</h2>
          <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider text-purple-600">Category</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'All Items' },
              { value: 'men', label: 'Men' },
              { value: 'women', label: 'Women' },
              { value: 'accessories', label: 'Accessories' }
            ].map(cat => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                  selectedCategory === cat.value
                    ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-200'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Price Filter */}
        <div className="mb-8">
          <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider text-purple-600">Rental Price</h3>
          <div className="flex flex-col gap-2">
            {[
              { value: 'all', label: 'All Prices' },
              { value: 'low', label: 'Under ₹300' },
              { value: 'mid', label: '₹300 - ₹600' },
              { value: 'high', label: 'Over ₹600' }
            ].map(price => (
              <button
                key={price.value}
                onClick={() => setSelectedPrice(price.value)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border ${
                  selectedPrice === price.value
                    ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border-purple-200'
                    : 'bg-white text-gray-600 border-gray-100 hover:border-purple-200 hover:bg-slate-50'
                }`}
              >
                {price.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reset Filters */}
        <button
          onClick={() => {
            setSelectedCategory('all');
            setSelectedPrice('all');
          }}
          className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-500 rounded-xl hover:bg-gray-50 hover:border-purple-300 hover:text-purple-600 transition font-bold text-sm"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
}
