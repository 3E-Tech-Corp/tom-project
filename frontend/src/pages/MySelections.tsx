import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { selectionApi, type UserSelection } from '../services/api';

export default function MySelections() {
  const [selections, setSelections] = useState<UserSelection[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const fetchSelections = async () => {
    setLoading(true);
    try {
      const data = await selectionApi.list();
      setSelections(data);
    } catch {
      setSelections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSelections();
  }, []);

  const handleRemove = async (id: number) => {
    setRemovingId(id);
    try {
      await selectionApi.remove(id);
      setSelections(prev => prev.filter(s => s.id !== id));
    } catch {
      // ignore
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">💕 My Selections</h1>
        <p className="text-gray-400 mt-1">Your saved dress picks</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-400 text-lg">Loading selections...</div>
        </div>
      ) : selections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-800 rounded-xl border border-gray-700">
          <div className="text-6xl mb-4">💕</div>
          <p className="text-gray-400 text-lg">No selections yet</p>
          <p className="text-gray-500 text-sm mt-1 mb-4">Browse the catalog and add dresses you love!</p>
          <Link
            to="/catalog"
            className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-xl transition-colors"
          >
            Browse Catalog
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {selections.map(selection => (
            <div
              key={selection.id}
              className="flex flex-col sm:flex-row gap-4 bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-rose-500/30 transition-colors"
            >
              <Link to={`/dresses/${selection.dressId}`} className="sm:w-32 shrink-0">
                <div className="aspect-[3/4] sm:h-40 overflow-hidden bg-gray-700">
                  <img
                    src={selection.dressImageUrl || `https://picsum.photos/seed/dress${selection.dressId}/200/267`}
                    alt={selection.dressName}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://picsum.photos/seed/dress${selection.dressId}/200/267`;
                    }}
                  />
                </div>
              </Link>

              <div className="flex-1 p-4 sm:py-4 sm:px-0 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Link
                        to={`/dresses/${selection.dressId}`}
                        className="text-white font-semibold text-lg hover:text-rose-400 transition-colors"
                      >
                        {selection.dressName}
                      </Link>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                        <span className="px-2 py-0.5 bg-rose-600/20 text-rose-400 rounded-full text-xs font-medium">
                          {selection.dressCategory}
                        </span>
                        <span>{selection.dressSize}</span>
                        <span>·</span>
                        <span>{selection.dressColor}</span>
                      </div>
                    </div>
                    <p className="text-rose-400 font-bold text-xl shrink-0">
                      ${selection.dressPrice?.toFixed(2)}
                    </p>
                  </div>
                  {selection.notes && (
                    <p className="text-gray-400 text-sm mt-2 italic">"{selection.notes}"</p>
                  )}
                </div>

                <div className="flex items-center justify-between mt-3">
                  <p className="text-gray-500 text-xs">
                    Added {new Date(selection.createdAt).toLocaleDateString()}
                  </p>
                  <button
                    onClick={() => handleRemove(selection.id)}
                    disabled={removingId === selection.id}
                    className="px-4 py-1.5 text-sm text-red-400 hover:text-white hover:bg-red-600 border border-red-500/30 hover:border-red-600 rounded-lg transition-all disabled:opacity-50"
                  >
                    {removingId === selection.id ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
