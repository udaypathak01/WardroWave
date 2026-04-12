import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, Star, Filter, X, ArrowLeft } from "lucide-react";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import { useCart } from "../context api/CartContext";
import { useWishlist } from "../context api/WishlistContext";
import api from "../utils/api";

function ProductCard({ product, onAddToCart }) {
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isFavorite = isInWishlist(product.id);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-full hover:shadow-lg transition">
      <div className="relative h-56 bg-gray-200 overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover hover:scale-110 transition duration-300"
        />
        <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
          Save{" "}
          {Math.round(
            ((product.originalPrice - product.rentalPrice) /
              product.originalPrice) *
              100
          )}
          %
        </div>
        <button
          onClick={() => toggleWishlist(product)}
          className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-lg"
        >
          <Heart
            className={`w-5 h-5 ${
              isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"
            }`}
          />
        </button>
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-bold text-gray-900 mb-2 text-sm line-clamp-2">
          {product.name}
        </h3>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
                  i < Math.floor(product.rating) ? "fill-current" : ""
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-600">({product.reviews})</span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-purple-600">
              ₹{product.rentalPrice}
            </span>
            <span className="text-sm text-gray-500 line-through">
              ₹{product.originalPrice}
            </span>
          </div>
        </div>

        <button
          onClick={() => onAddToCart(product)}
          className="mt-auto w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:shadow-lg transition"
        >
          <ShoppingCart className="w-4 h-4" />
          Add to Cart
        </button>
      </div>
    </div>
  );
}

export default function MenCategory() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [sortBy, setSortBy] = useState("trending");
  const [priceRange, setPriceRange] = useState(1000);
  const [menItems, setMenItems] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.product.getAll({ category: "men" });
        setMenItems(res.data?.products || res.products || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProducts();
  }, []);

  const handleAddToCart = (product) => {
    addToCart({
      id: product.id,
      name: product.name,
      rentalPrice: product.rentalPrice,
      image: product.image,
      category: "men",
      duration: 3,
      rentalDays: 3,
      quantity: 1,
    });
  };

  let sortedItems = [...menItems];
  if (sortBy === "price-low")
    sortedItems.sort((a, b) => a.rentalPrice - b.rentalPrice);
  if (sortBy === "price-high")
    sortedItems.sort((a, b) => b.rentalPrice - a.rentalPrice);
  if (sortBy === "rating") sortedItems.sort((a, b) => b.rating - a.rating);

  const filteredItems = sortedItems.filter(
    (item) => item.rentalPrice <= priceRange
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />

      {/* Category Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 py-8">
        <div className="container mx-auto px-4">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center text-white mb-4 hover:opacity-80"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">Men's Fashion</h1>
          <p className="text-gray-100">
            Discover premium men's clothing at unbeatable rental prices
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </h3>

              {/* Sort */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none"
                >
                  <option value="trending">Trending</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Max Price: ₹{priceRange}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  value={priceRange}
                  onChange={(e) => setPriceRange(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Items Count */}
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <span className="font-bold text-purple-600">
                    {filteredItems.length}
                  </span>{" "}
                  items found
                </p>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg">
                <p className="text-gray-600 text-lg">
                  No items found in this price range
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
