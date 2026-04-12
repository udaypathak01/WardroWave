/**
 * SkeletonCard — shimmer placeholder for product / rental cards
 * Usage: <SkeletonCard /> or <SkeletonCard count={6} />
 */
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col">
      {/* Image */}
      <div className="skeleton h-56 w-full" />
      {/* Body */}
      <div className="p-4 flex flex-col gap-3">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="flex gap-2 mt-1">
          <div className="skeleton h-3 w-8 rounded" />
          <div className="skeleton h-3 w-8 rounded" />
          <div className="skeleton h-3 w-8 rounded" />
          <div className="skeleton h-3 w-8 rounded" />
          <div className="skeleton h-3 w-8 rounded" />
        </div>
        <div className="skeleton h-5 w-1/3 rounded mt-1" />
        <div className="skeleton h-10 w-full rounded-xl mt-2" />
      </div>
    </div>
  );
}

/**
 * SkeletonGrid — renders N skeleton cards in a responsive grid
 */
export function SkeletonGrid({ count = 6, cols = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' }) {
  return (
    <div className={`grid ${cols} gap-4 md:gap-6`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/**
 * SkeletonDetail — shimmer for product detail page hero
 */
export function SkeletonDetail() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      <div className="skeleton rounded-3xl h-96 lg:h-[520px] w-full" />
      <div className="flex flex-col gap-4">
        <div className="skeleton h-8 w-2/3 rounded" />
        <div className="skeleton h-4 w-1/3 rounded" />
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-3/4 rounded" />
        <div className="flex gap-3 mt-4">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-10 w-10 rounded-lg" />)}
        </div>
        <div className="skeleton h-14 w-full rounded-xl mt-4" />
        <div className="skeleton h-14 w-full rounded-xl" />
      </div>
    </div>
  );
}

export default SkeletonCard;
