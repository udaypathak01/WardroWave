import { useState, useEffect, useDeferredValue } from "react";
import Header from '../components/common/Header';
import Footer from "../components/common/Footer";
import RentalCard from "../components/rentals/RentalCard";
import FilterSidebar from "../components/rentals/FilterSidebar";
import RentalTopBar from "../components/rentals/RentalTopBar";
import PageTransition, { StaggerContainer, StaggerItem } from '../components/common/PageTransition';
import { SkeletonGrid } from '../components/common/Skeleton';
import { useLocation } from "react-router-dom";
import { mapCatalogProduct } from "../utils/api";
import { useCategoriesQuery, useProductsQuery } from "../lib/api/hooks";

function flattenCategories(categories = []) {
  return categories.flatMap((category) => [
    category,
    ...flattenCategories(category.children || []),
  ]);
}

export default function Rentals({ initialCategory = 'all' }) {
  const location = useLocation();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(
    location.state?.gender || initialCategory,
  );
  const [selectedPrice, setSelectedPrice] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery.trim());
  const categoriesQuery = useCategoriesQuery();
  const [selectedCategoryId, setSelectedCategoryId] = useState(location.state?.categoryId || "");

  useEffect(() => {
    setSearchQuery(location.state?.searchQuery || "");
    setSelectedCategoryId(location.state?.categoryId || "");
    setSelectedCategory(location.state?.gender || initialCategory);
  }, [
    initialCategory,
    location.state?.searchQuery,
    location.state?.categoryId,
    location.state?.gender,
  ]);

  const allCategories = flattenCategories(categoriesQuery.data?.data || []);
  const accessoriesCategory = allCategories.find((category) =>
    `${category.slug} ${category.name}`.toLowerCase().includes("accessor"),
  );
  const sortMap = {
    featured: "featured",
    newest: "newest",
    "price-low": "price_asc",
    "price-high": "price_desc",
    rating: "rating",
  };
  const priceFilters = {
    all: {},
    low: { maxPrice: 29999 },
    mid: { minPrice: 30000, maxPrice: 59999 },
    high: { minPrice: 60000 },
  };
  const productFilters = {
    limit: 100,
    page: 1,
    sort: sortMap[sortBy],
    ...(deferredSearchQuery && { q: deferredSearchQuery }),
    ...(["men", "women"].includes(selectedCategory) && { gender: selectedCategory }),
    ...(selectedCategoryId && { category: selectedCategoryId }),
    ...(selectedCategory === "accessories" && accessoriesCategory && {
      category: accessoriesCategory._id,
    }),
    ...priceFilters[selectedPrice],
  };
  const categoryReady = selectedCategory !== "accessories"
    || (!categoriesQuery.isPending && Boolean(accessoriesCategory));
  const productsQuery = useProductsQuery(productFilters, categoryReady);
  const filteredItems = (productsQuery.data?.data || []).map(mapCatalogProduct);
  const loading = categoriesQuery.isPending || (categoryReady && productsQuery.isPending);
  const loadError = categoriesQuery.error || productsQuery.error;

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
            setSelectedCategory={(category) => {
              setSelectedCategory(category);
              setSelectedCategoryId("");
            }}
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
            ) : loadError ? (
              <div role="alert" className="text-center py-12 bg-white rounded-lg">
                <p className="text-gray-700 text-lg mb-4">
                  We couldn't load the collection. Please try again.
                </p>
                <button
                  onClick={() => {
                    if (categoriesQuery.error) categoriesQuery.refetch();
                    if (productsQuery.error) productsQuery.refetch();
                  }}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-pink-600 transition font-medium"
                >
                  Retry
                </button>
              </div>
            ) : selectedCategory === "accessories" && !accessoriesCategory ? (
              <div role="status" className="text-center py-12 bg-white rounded-lg">
                <p className="text-gray-600 text-lg">
                  The accessories category isn't available yet.
                </p>
              </div>
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
                    setSelectedCategoryId("");
                    setSelectedPrice("all");
                    setSearchQuery("");
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
