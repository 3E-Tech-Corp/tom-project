import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { dressApi, selectionApi, type Dress } from '../services/api';

export default function DressDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dress, setDress] = useState<Dress | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    dressApi.get(Number(id))
      .then(setDress)
      .catch(() => navigate('/catalog'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleAddToSelections = async () => {
    if (!dress) return;
    setAdding(true);
    setMessage(null);
    try {
      await selectionApi.add({ dressId: dress.id, notes });
      setMessage({ type: 'success', text: 'Added to your selections! ✨' });
      setNotes('');
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to add' });
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400 text-lg">Loading...</div>
      </div>
    );
  }

  if (!dress) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-gray-400 text-lg">Dress not found</p>
        <Link to="/catalog" className="text-rose-400 hover:text-rose-300 mt-2">
          ← Back to catalog
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        to="/catalog"
        className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-6"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Catalog
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image */}
        <div className="relative rounded-2xl overflow-hidden bg-gray-800 border border-gray-700">
          <div className="aspect-[3/4]">
            <img
              src={dress.imageUrl || `https://images.unsplash.com/photo-1518622358385-8ea7d0794bf6?w=600&h=800&fit=crop&q=80`}
              alt={dress.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1518622358385-8ea7d0794bf6?w=600&h=800&fit=crop&q=80`;
              }}
            />
          </div>
          {!dress.inStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-bold text-2xl bg-red-600 px-6 py-2 rounded-full">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <span className="inline-block px-3 py-1 bg-rose-600/20 text-rose-400 text-sm font-semibold rounded-full mb-3">
              {dress.category}
            </span>
            <h1 className="text-4xl font-bold text-white">{dress.name}</h1>
            <p className="text-rose-400 font-bold text-3xl mt-3">${dress.price.toFixed(2)}</p>
          </div>

          <p className="text-gray-300 leading-relaxed text-lg">
            {dress.description || 'A beautiful dress for any occasion.'}
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <p className="text-gray-400 text-sm">Size</p>
              <p className="text-white font-semibold text-lg mt-1">{dress.size}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <p className="text-gray-400 text-sm">Color</p>
              <p className="text-white font-semibold text-lg mt-1">{dress.color}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <p className="text-gray-400 text-sm">Availability</p>
              <p className={`font-semibold text-lg mt-1 ${dress.inStock ? 'text-green-400' : 'text-red-400'}`}>
                {dress.inStock ? 'In Stock' : 'Out of Stock'}
              </p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <p className="text-gray-400 text-sm">Category</p>
              <p className="text-white font-semibold text-lg mt-1">{dress.category}</p>
            </div>
          </div>

          {/* Add to selections */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 space-y-4">
            <h3 className="text-white font-semibold text-lg">💕 Add to My Selections</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes (optional)... e.g., 'For the summer gala'"
              rows={3}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
            />
            <button
              onClick={handleAddToSelections}
              disabled={adding || !dress.inStock}
              className="w-full py-3 px-6 bg-rose-600 hover:bg-rose-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              {adding ? 'Adding...' : !dress.inStock ? 'Out of Stock' : '✨ Add to My Selections'}
            </button>

            {message && (
              <div
                className={`px-4 py-3 rounded-lg text-sm ${
                  message.type === 'success'
                    ? 'bg-green-900/50 border border-green-500 text-green-300'
                    : 'bg-red-900/50 border border-red-500 text-red-300'
                }`}
              >
                {message.text}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
