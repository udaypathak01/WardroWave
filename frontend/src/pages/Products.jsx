import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star, Filter, X } from 'lucide-react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import PageTransition, { StaggerContainer, StaggerItem } from '../components/common/PageTransition';


const PRODUCTS = [
  { id: 1, name: 'Premium Formal Blazer', price: 2499, rating: 4.5, reviews: 128, category: 'men', image: 'https://cdn.pixabay.com/photo/2015/07/06/21/58/blazer-835658_640.jpg', inStock: true },
  { id: 2, name: 'Embroidered Kurti', price: 1299, rating: 4.8, reviews: 256, category: 'women', image: 'https://cdn.pixabay.com/photo/2017/01/24/15/45/kurti-2004638_640.jpg', inStock: true },
  { id: 3, name: 'Cotton Casual Shirt', price: 899, rating: 4.3, reviews: 89, category: 'men', image: 'https://cdn.pixabay.com/photo/2016/12/06/18/41/man-1888810_640.jpg', inStock: true },
  { id: 4, name: 'Blue Denim Jeans', price: 1599, rating: 4.6, reviews: 342, category: 'men', image: 'https://cdn.pixabay.com/photo/2017/01/25/12/08/jeans-2006598_640.jpg', inStock: true },
  { id: 5, name: 'Designer Saree', price: 3499, rating: 4.4, reviews: 167, category: 'women', image: 'https://cdn.pixabay.com/photo/2014/11/13/23/32/saree-532008_640.jpg', inStock: true },
  { id: 6, name: 'Silk Dupatta', price: 599, rating: 4.7, reviews: 98, category: 'accessories', image: 'https://cdn.pixabay.com/photo/2018/03/06/13/17/dupatta-3204842_640.jpg', inStock: true },
  { id: 7, name: 'Wool Shawl', price: 1899, rating: 4.5, reviews: 201, category: 'women', image: 'https://cdn.pixabay.com/photo/2019/06/22/14/51/scarf-4291263_640.jpg', inStock: false },
  { id: 8, name: 'Printed Cotton Dress', price: 1199, rating: 4.6, reviews: 134, category: 'women', image: 'https://cdn.pixabay.com/photo/2018/01/04/00/09/floral-dress-3061670_640.jpg', inStock: true },
  { id: 9, name: 'Leather Belt', price: 799, rating: 4.8, reviews: 245, category: 'accessories', image: 'https://cdn.pixabay.com/photo/2016/11/29/05/45/accessories-1867402_640.jpg', inStock: true },
  { id: 10, name: 'Ethnic Bracelet Set', price: 599, rating: 4.7, reviews: 312, category: 'accessories', image: 'https://cdn.pixabay.com/photo/2020/05/17/18/38/bracelets-5181876_640.jpg', inStock: true },
  { id: 11, name: 'Traditional Kurta Pajama', price: 2199, rating: 4.9, reviews: 189, category: 'men', image: 'https://cdn.pixabay.com/photo/2016/12/06/18/38/portrait-1888807_640.jpg', inStock: true },
  { id: 12, name: 'Canvas Sports Shoes', price: 1699, rating: 4.5, reviews: 376, category: 'accessories', image: 'https://cdn.pixabay.com/photo/2015/04/23/22/40/canvas-shoes-738258_640.jpg', inStock: true },
];

function ProductCard({ product }) {
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full group card-lift hover:-translate-y-1">
      <Link to={`/product/${product.id}`} className="relative h-48 sm:h-56 md:h-64 bg-gray-200 overflow-hidden block">
        <img 
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
            <span className="text-white font-bold text-lg border-2 border-white px-4 py-1 rounded-lg">Out of Stock</span>
          </div>
        )}
        <button 
          onClick={(e) => { e.preventDefault(); setIsFavorite(!isFavorite); }}
          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-300 z-10"
        >
          <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
        </button>
      </Link>

      <div className="p-4 md:p-5 flex flex-col flex-grow">
        <Link to={`/product/${product.id}`} className="hover:text-purple-600 transition-colors">
          <h3 className="font-bold text-gray-900 mb-2 text-sm sm:text-base line-clamp-2">{product.name}</h3>
        </Link>
        
        <div className="flex items-center gap-2 mb-3">
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`w-3 sm:w-4 h-3 sm:h-4 ${i < Math.floor(product.rating) ? 'fill-current' : ''}`}
              />
            ))}
          </div>
          <span className="text-xs sm:text-sm text-gray-600">({product.reviews})</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-lg sm:text-xl font-bold text-gray-900">₹{product.price}</span>
          <button 
            disabled={!product.inStock}
            className="p-2 bg-purple-600 text-white rounded-lg hover:bg-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="w-4 sm:w-5 h-4 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPrice, setSelectedPrice] = useState('all');
  const [sortBy, setSortBy] = useState('featured');

  useEffect(() => {

  }, []);

  // Filter products
  let filteredProducts = PRODUCTS.filter(product => {
    if (selectedCategory !== 'all' && product.category !== selectedCategory) return false;
    
    if (selectedPrice === 'low') {
      return product.price < 1000;
    } else if (selectedPrice === 'mid') {
      return product.price >= 1000 && product.price < 2500;
    } else if (selectedPrice === 'high') {
      return product.price >= 2500;
    }
    
    return true;
  });

  // Sort products
  if (sortBy === 'price-low') {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-high') {
    filteredProducts.sort((a, b) => b.price - a.price);
  } else if (sortBy === 'rating') {
    filteredProducts.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === 'newest') {
    filteredProducts.sort((a, b) => b.id - a.id);
  }

  return (
    <PageTransition className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      <Header />

      {/* Page Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 py-8 md:py-12">
        <div className="container mx-auto px-4 md:px-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Our Collection</h1>
          <p className="text-gray-100 text-sm md:text-base">Discover our premium Indian fashion collection</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
          
          {/* Sidebar Filters - Mobile Toggle */}
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block lg:w-64 flex-shrink-0`}>
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <div className="flex justify-between items-center mb-6 lg:hidden">
                <h2 className="text-xl font-bold text-gray-900">Filters</h2>
                <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-3">Category</h3>
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'All Products' },
                    { value: 'men', label: 'Men' },
                    { value: 'women', label: 'Women' },
                    { value: 'accessories', label: 'Accessories' }
                  ].map(cat => (
                    <label key={cat.value} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        value={cat.value}
                        checked={selectedCategory === cat.value}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-4 h-4 text-purple-600"
                      />
                      <span className="ml-3 text-gray-700 text-sm">{cat.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-3">Price Range</h3>
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'All Prices' },
                    { value: 'low', label: 'Under ₹1000' },
                    { value: 'mid', label: '₹1000 - ₹2500' },
                    { value: 'high', label: 'Over ₹2500' }
                  ].map(price => (
                    <label key={price.value} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="price"
                        value={price.value}
                        checked={selectedPrice === price.value}
                        onChange={(e) => setSelectedPrice(e.target.value)}
                        className="w-4 h-4 text-purple-600"
                      />
                      <span className="ml-3 text-gray-700 text-sm">{price.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Reset Filters */}
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedPrice('all');
                }}
                className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Products Section */}
          <div className="flex-1">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  <Filter className="w-4 h-4" />
                  <span className="text-sm font-medium">Filters</span>
                </button>
                <span className="text-gray-600 text-sm md:text-base">
                  Showing <span className="font-bold">{filteredProducts.length}</span> products
                </span>
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm"
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>

            {/* Products Grid */}
            {filteredProducts.length > 0 ? (
              <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filteredProducts.map(product => (
                  <StaggerItem key={product.id}>
                    <ProductCard product={product} />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg">
                <p className="text-gray-600 text-lg mb-4">No products found</p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedPrice('all');
                  }}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-pink-600 transition font-medium"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </PageTransition>
  );
}
