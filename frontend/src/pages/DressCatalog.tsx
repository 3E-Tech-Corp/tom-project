import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { dressApi, type Dress, type DressCategory, type DressFilters } from '../services/api';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const COLORS = [
  'Black', 'White', 'Red', 'Pink', 'Blue', 'Navy',
  'Green', 'Purple', 'Gold', 'Silver', 'Ivory', 'Burgundy',
];

export default function DressCatalog() {
  const [dresses, setDresses] = useState<Dress[]>([]);
  const [categories, setCategories] = useState<DressCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<DressFilters>({});
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const fetchDresses = useCallback(async () => {
    setLoading(true);
    try {
      const activeFilter: DressFilters = { ...filters };
      if (search) activeFilter.search = search;
      if (selectedCategories.length === 1) activeFilter.category = selectedCategories[0];
      const data = await dressApi.list(activeFilter);
      // Client-side multi-category filter
      if (selectedCategories.length > 1) {
        setDresses(data.filter(d => selectedCategories.includes(d.category)));
      } else {
        setDresses(data);
      }
    } catch {
      setDresses([]);
    } finally {
      setLoading(false);
    }
  }, [filters, search, selectedCategories]);

  useEffect(() => {
    dressApi.categories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    fetchDresses();
  }, [fetchDresses]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const clearFilters = () => {
    setFilters({});
    setSelectedCategories([]);
    setSearch('');
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">👗 Dress Catalog</h1>
          <p className="text-gray-400 mt-1">Browse our beautiful collection</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="sm:hidden px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium"
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search dresses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 pl-10 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          />
          <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Filters */}
        <aside className={`w-64 shrink-0 ${showFilters ? 'block' : 'hidden'} sm:block`}>
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 space-y-6 sticky top-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">Filters</h3>
              <button onClick={clearFilters} className="text-xs text-rose-400 hover:text-rose-300">
                Clear all
              </button>
            </div>

            {/* Categories */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">Category</h4>
              <div className="space-y-2">
                {categories.map(cat => (
                  <label key={cat.id} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat.name)}
                      onChange={() => toggleCategory(cat.name)}
                      className="rounded border-gray-600 bg-gray-700 text-rose-500 focus:ring-rose-500"
                    />
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                      {cat.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Size */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">Size</h4>
              <select
                value={filters.size || ''}
                onChange={(e) => setFilters(f => ({ ...f, size: e.target.value || undefined }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">All Sizes</option>
                {SIZES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Color */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">Color</h4>
              <select
                value={filters.color || ''}
                onChange={(e) => setFilters(f => ({ ...f, color: e.target.value || undefined }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">All Colors</option>
                {COLORS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">Price Range</h4>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice ?? ''}
                  onChange={(e) => setFilters(f => ({
                    ...f,
                    minPrice: e.target.value ? Number(e.target.value) : undefined
                  }))}
                  className="w-1/2 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice ?? ''}
                  onChange={(e) => setFilters(f => ({
                    ...f,
                    maxPrice: e.target.value ? Number(e.target.value) : undefined
                  }))}
                  className="w-1/2 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* In Stock */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.inStock === true}
                  onChange={(e) => setFilters(f => ({
                    ...f,
                    inStock: e.target.checked ? true : undefined
                  }))}
                  className="rounded border-gray-600 bg-gray-700 text-rose-500 focus:ring-rose-500"
                />
                <span className="text-sm text-gray-300">In Stock Only</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Dress Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-gray-400 text-lg">Loading dresses...</div>
            </div>
          ) : dresses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="text-6xl mb-4">👗</div>
              <p className="text-gray-400 text-lg">No dresses found</p>
              <p className="text-gray-500 text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {dresses.map(dress => (
                <Link
                  key={dress.id}
                  to={`/dresses/${dress.id}`}
                  className="group bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-rose-500/50 hover:shadow-lg hover:shadow-rose-500/10 transition-all duration-300"
                  style={{ transformStyle: 'preserve-3d' }}
                  onMouseMove={(e) => {
                    const card = e.currentTarget;
                    const rect = card.getBoundingClientRect();
                    const x = (e.clientX - rect.left) / rect.width - 0.5;
                    const y = (e.clientY - rect.top) / rect.height - 0.5;
                    card.style.transform = `perspective(600px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) scale3d(1.02, 1.02, 1.02)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'perspective(600px) rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)';
                  }}
                >
                  <div className="aspect-[3/4] overflow-hidden relative" style={{ background: 'radial-gradient(circle, #1f1f2e 0%, #111118 100%)' }}>
                    <img
                      src={dress.imageUrl || `https://images.unsplash.com/photo-1518622358385-8ea7d0794bf6?w=400&h=533&fit=crop&q=80`}
                      alt={dress.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                      style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.5))' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1518622358385-8ea7d0794bf6?w=400&h=533&fit=crop&q=80`;
                      }}
                    />
                    {!dress.inStock && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white font-bold text-lg bg-red-600 px-4 py-1 rounded-full">Out of Stock</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 bg-rose-600/90 text-white text-xs font-semibold rounded-full backdrop-blur-sm">
                        {dress.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-semibold text-lg group-hover:text-rose-400 transition-colors">
                      {dress.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                      <span>{dress.size}</span>
                      <span>·</span>
                      <span>{dress.color}</span>
                    </div>
                    <p className="text-rose-400 font-bold text-xl mt-2">${dress.price.toFixed(2)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
