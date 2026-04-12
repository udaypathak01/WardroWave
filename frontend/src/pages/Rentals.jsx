import { useState, useEffect } from "react";
import Header from '../components/common/Header';
import Footer from "../components/common/Footer";
import RentalCard from "../components/rentals/RentalCard";
import FilterSidebar from "../components/rentals/FilterSidebar";
import RentalTopBar from "../components/rentals/RentalTopBar";
import PageTransition, { StaggerContainer, StaggerItem } from '../components/common/PageTransition';
import { SkeletonGrid } from '../components/common/Skeleton';
import { useLocation } from "react-router-dom";
import api from "../utils/api";

export default function Rentals() {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPrice, setSelectedPrice] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set search query from header navigation
    if (location.state?.searchQuery) {
      setSearchQuery(location.state.searchQuery);
    }
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await api.product.getAll();
        setProducts(res.data?.products || res.products || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [location.state?.searchQuery]);

  // Filter items
  let filteredItems = products.filter((item) => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      if (
        !item.name.toLowerCase().includes(query) &&
        !item.category.toLowerCase().includes(query)
      ) {
        return false;
      }
    }

    // Category filter
    if (selectedCategory !== "all" && item.category !== selectedCategory)
      return false;

    // Price filter
    if (selectedPrice === "low") {
      return item.rentalPrice < 300;
    } else if (selectedPrice === "mid") {
      return item.rentalPrice >= 300 && item.rentalPrice < 600;
    } else if (selectedPrice === "high") {
      return item.rentalPrice >= 600;
    }

    return true;
  });

  // Sort items
  if (sortBy === "price-low") {
    filteredItems.sort((a, b) => a.rentalPrice - b.rentalPrice);
  } else if (sortBy === "price-high") {
    filteredItems.sort((a, b) => b.rentalPrice - a.rentalPrice);
  } else if (sortBy === "rating") {
    filteredItems.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === "newest") {
    filteredItems.sort((a, b) => b.id - a.id);
  }

  return (
    <PageTransition className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      <Header />

      {/* Page Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 py-8 md:py-12">
        <div className="container mx-auto px-4 md:px-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Rent Your Style
          </h1>
          <p className="text-gray-100 text-sm md:text-base">
            Premium fashion rentals at 75% less than retail price
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
          {/* Sidebar Filters */}
          <FilterSidebar
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedPrice={selectedPrice}
            setSelectedPrice={setSelectedPrice}
          />{" "}
          {/* Rentals Section */}
          <div className="flex-1">
            {/* Top Bar */}
            <RentalTopBar
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              filteredItems={filteredItems}
              sortBy={sortBy}
              setSortBy={setSortBy}
            />

            {/* Rentals Grid */}
            {loading ? (
              <SkeletonGrid count={6} />
            ) : filteredItems.length > 0 ? (
              <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filteredItems.map((item) => (
                  <StaggerItem key={item.id}>
                    <RentalCard item={item} />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg">
                <p className="text-gray-600 text-lg mb-4">No items found</p>
                <button
                  onClick={() => {
                    setSelectedCategory("all");
                    setSelectedPrice("all");
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
