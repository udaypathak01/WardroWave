import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FadeIn, StaggerContainer } from '../common/PageTransition';
import ThemeBubbles from '../common/ThemeBubbles';
import { useCategoriesQuery, useProductsQuery } from '../../lib/api/hooks';

function flattenCategories(categories = []) {
  return categories.flatMap((category) => [
    category,
    ...flattenCategories(category.children || []),
  ]);
}

export default function CategorySection() {
  const categoriesQuery = useCategoriesQuery();
  const womenQuery = useProductsQuery({ gender: 'women', limit: 1, sort: 'featured' });
  const menQuery = useProductsQuery({ gender: 'men', limit: 1, sort: 'featured' });
  const categories = flattenCategories(categoriesQuery.data?.data || []);
  const accessoriesCategory = categories.find((category) =>
    `${category.slug} ${category.name}`.toLowerCase().includes('accessor'),
  );
  const accessoriesQuery = useProductsQuery(
    { category: accessoriesCategory?._id, limit: 1, sort: 'featured' },
    Boolean(accessoriesCategory),
  );
  const cards = [
    {
      id: 'women',
      title: 'Womenswear',
      subtitle: 'Explore the women’s rental collection',
      image: womenQuery.data?.data?.[0]?.images?.[0]?.url,
      to: { pathname: '/rentals', state: { gender: 'women' } },
    },
    ...(accessoriesCategory ? [{
      id: accessoriesCategory._id,
      title: accessoriesCategory.name,
      subtitle: 'Explore accessories in the live collection',
      image: accessoriesQuery.data?.data?.[0]?.images?.[0]?.url,
      to: { pathname: '/rentals', state: { categoryId: accessoriesCategory._id } },
    }] : []),
    {
      id: 'men',
      title: 'Menswear',
      subtitle: 'Explore the men’s rental collection',
      image: menQuery.data?.data?.[0]?.images?.[0]?.url,
      to: { pathname: '/rentals', state: { gender: 'men' } },
    },
  ];
  const hasCatalogError = categoriesQuery.isError || womenQuery.isError || menQuery.isError
    || Boolean(accessoriesCategory && accessoriesQuery.isError);

  return (
    <section className="category-section py-8 sm:py-16 lg:py-20 bg-slate-50 relative overflow-hidden">
      <ThemeBubbles />
      <div className="container mx-auto px-3 sm:px-4 md:px-6 relative z-10">

        <FadeIn className="text-center mb-10 md:mb-16">
          <h2 className="category-section-title section-title text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-4">
            Shop by <span className="text-gradient">Category</span>
          </h2>
          <p className="category-section-desc text-base sm:text-lg text-slate-600 font-medium max-w-2xl mx-auto">
            Browse styles from the live WardroWave rental catalog.
          </p>
        </FadeIn>

        <StaggerContainer>
          {hasCatalogError && (
            <div role="alert" className="mb-5 text-center text-sm text-gray-600">
              Some collections couldn't be loaded.
              <button
                onClick={() => {
                  if (categoriesQuery.isError) categoriesQuery.refetch();
                  if (womenQuery.isError) womenQuery.refetch();
                  if (menQuery.isError) menQuery.refetch();
                  if (accessoriesQuery.isError) accessoriesQuery.refetch();
                }}
                className="ml-1 font-semibold text-purple-600 underline"
              >
                Retry
              </button>
            </div>
          )}
          <div className="category-grid grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 min-h-[350px] sm:min-h-[400px] lg:min-h-[500px]">
            {cards.map((category) => (
              <FadeIn key={category.id} className="h-full">
                <Link to={category.to} className="category-card block relative w-full h-full rounded-[24px] md:rounded-[32px] overflow-hidden group cursor-pointer shadow-lg hover:shadow-xl border border-slate-200/50 transition-shadow duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-300 via-pink-200 to-slate-300" />
                  {category.image && (
                    <img
                      src={category.image}
                      alt={category.title}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
                    />
                  )}

                  {/* Dynamic Dark Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent bottom-0"></div>

                  {/* Content Container */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 md:p-8 flex items-end justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-2xl sm:text-3xl font-bold text-white mb-1 md:mb-2 tracking-tight">
                        {category.title}
                      </h3>
                      <p className="text-slate-200 text-sm md:text-base font-normal">
                        {category.subtitle}
                      </p>
                    </div>

                    {/* Bottom Right Decorative Arrow */}
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-white/70 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-900 group-hover:bg-white group-hover:scale-110 transition-all duration-300 shrink-0">
                      <ArrowUpRight className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>
        </StaggerContainer>

      </div>
    </section>
  );
}
