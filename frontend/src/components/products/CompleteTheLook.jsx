import { Link } from 'react-router-dom';
import { ChevronRight, Sparkles } from 'lucide-react';
import { FadeIn } from '../common/PageTransition';
import { mapCatalogProduct } from '../../utils/api';
import { useSimilarProductsQuery } from '../../lib/api/hooks';

export default function CompleteTheLook({ currentProductSlug }) {
  const productsQuery = useSimilarProductsQuery(currentProductSlug);
  const products = (productsQuery.data?.data || []).map(mapCatalogProduct);

  if (productsQuery.isPending) return null;
  if (productsQuery.isError) {
    return (
      <p role="alert" className="mt-8 text-sm text-gray-600">
        Similar items couldn't be loaded.
        <button onClick={() => productsQuery.refetch()} className="ml-2 font-semibold text-purple-600 underline">
          Try again
        </button>
      </p>
    );
  }
  if (!products.length) return null;

  return (
    <section className="mt-16 pt-16 border-t border-gray-100">
      <FadeIn className="flex justify-between items-end mb-8">
        <div>
          <div className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-purple-50 text-purple-600 font-bold text-xs uppercase mb-3">
            <Sparkles className="w-4 h-4" /> You may also like
          </div>
          <h2 className="text-3xl font-black text-gray-900">Complete The Look</h2>
          <p className="text-gray-500 font-medium">More pieces from our current collection.</p>
        </div>
        <Link to="/rentals" className="text-purple-600 font-bold hover:text-pink-600 transition flex items-center">
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      </FadeIn>
      <div className="flex gap-6 overflow-x-auto snap-x hide-scrollbar pb-8 pt-4">
        {products.map((product) => (
          <Link key={product.id} to={`/product/${product.slug}`} className="w-56 md:w-64 snap-center shrink-0 group">
            <div className="h-64 rounded-[24px] overflow-hidden shadow-md bg-gray-50 mb-4">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
            </div>
            <p className="font-bold text-gray-900">{product.name}</p>
            <p className="text-sm text-purple-700">From ₹{product.rentalPrice}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
