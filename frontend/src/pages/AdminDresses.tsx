import { useState, useEffect } from 'react';
import { dressApi, imageApi, type Dress, type CreateDressRequest } from '../services/api';

const emptyDress: CreateDressRequest = {
  name: '', description: '', imageUrl: '', category: 'General',
  size: 'M', color: 'Black', price: 1, inStock: true,
};

export default function AdminDresses() {
  const [dresses, setDresses] = useState<Dress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CreateDressRequest>(emptyDress);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [imagePreviewStatus, setImagePreviewStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [removingBg, setRemovingBg] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const d = await dressApi.list();
      setDresses(d);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyDress);
    setShowForm(true);
    setError('');
    setImagePreviewStatus('idle');
  };

  const openEdit = (dress: Dress) => {
    setEditingId(dress.id);
    setForm({
      name: dress.name,
      description: dress.description,
      imageUrl: dress.imageUrl,
      category: dress.category,
      size: dress.size,
      color: dress.color,
      price: dress.price,
      inStock: dress.inStock,
    });
    setShowForm(true);
    setError('');
    setImagePreviewStatus(dress.imageUrl ? 'loading' : 'idle');
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required'); return; }

    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await dressApi.update(editingId, form);
      } else {
        await dressApi.create(form);
      }
      setShowForm(false);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this dress?')) return;
    setDeletingId(id);
    try {
      await dressApi.delete(id);
      setDresses(prev => prev.filter(d => d.id !== id));
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  };

  const updateField = <K extends keyof CreateDressRequest>(key: K, value: CreateDressRequest[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleRemoveBackground = async () => {
    if (!form.imageUrl.trim()) return;
    setRemovingBg(true);
    setError('');
    try {
      const result = await imageApi.removeBackground(form.imageUrl.trim());
      updateField('imageUrl', result.url);
      setImagePreviewStatus('loading');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Background removal failed');
    } finally {
      setRemovingBg(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(600px) rotateY(${x * 15}deg) rotateX(${-y * 15}deg) scale3d(1.03, 1.03, 1.03)`;
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'perspective(600px) rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">🛠️ Manage Dresses</h1>
          <p className="text-gray-400 mt-1">Add, edit, and remove dresses from the catalog</p>
        </div>
        <button
          onClick={openCreate}
          className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-xl transition-colors"
        >
          + Add Dress
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingId ? 'Edit Dress' : 'Add New Dress'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white text-2xl">
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  placeholder="Elegant Evening Gown"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Image URL</label>
                <input
                  type="text"
                  value={form.imageUrl}
                  onChange={(e) => {
                    updateField('imageUrl', e.target.value);
                    setImagePreviewStatus(e.target.value.trim() ? 'loading' : 'idle');
                  }}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  placeholder="https://example.com/dress-image.jpg"
                />
                {/* Image URL Preview */}
                {form.imageUrl.trim() && (
                  <div className="mt-3 rounded-lg border border-gray-600 overflow-hidden bg-gray-900/50">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
                      <span className="text-xs font-medium text-gray-400">Image Preview</span>
                      {imagePreviewStatus === 'loading' && (
                        <span className="flex items-center gap-1.5 text-xs text-yellow-400">
                          <div className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                          Loading...
                        </span>
                      )}
                      {imagePreviewStatus === 'loaded' && (
                        <span className="text-xs text-green-400">✓ Image loaded</span>
                      )}
                      {imagePreviewStatus === 'error' && (
                        <span className="text-xs text-red-400">✗ Failed to load</span>
                      )}
                    </div>
                    <div className="p-3 flex items-center justify-center" style={{ minHeight: 120 }}>
                      {imagePreviewStatus === 'error' ? (
                        <div className="text-center py-4">
                          <p className="text-red-400 text-sm font-medium">Image could not be loaded</p>
                          <p className="text-gray-500 text-xs mt-1">Make sure the URL points directly to an image file (.jpg, .png, etc.)</p>
                          <p className="text-gray-500 text-xs">Webpage URLs (Amazon, Pinterest, etc.) won't work — use the direct image link</p>
                        </div>
                      ) : (
                        <img
                          src={form.imageUrl.trim()}
                          alt="Preview"
                          className="max-h-48 max-w-full object-contain rounded"
                          onLoad={() => setImagePreviewStatus('loaded')}
                          onError={() => setImagePreviewStatus('error')}
                        />
                      )}
                    </div>
                    {/* Remove Background Button */}
                    {imagePreviewStatus === 'loaded' && (
                      <div className="px-3 pb-3">
                        <button
                          type="button"
                          onClick={handleRemoveBackground}
                          disabled={removingBg}
                          className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          {removingBg ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Removing background...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              ✨ Remove Background
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-gray-600 text-white font-medium rounded-xl transition-colors"
              >
                {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dress List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-400 text-lg">Loading...</div>
        </div>
      ) : dresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-800 rounded-xl border border-gray-700">
          <div className="text-6xl mb-4">👗</div>
          <p className="text-gray-400 text-lg">No dresses yet</p>
          <p className="text-gray-500 text-sm mt-1">Click "Add Dress" to get started</p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {dresses.map(dress => (
              <div
                key={dress.id}
                className="bg-gray-900/50 rounded-xl border border-gray-700 overflow-hidden hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10"
                style={{ transition: 'transform 0.15s ease-out, border-color 0.3s, box-shadow 0.3s', transformStyle: 'preserve-3d' }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <div className="aspect-[3/4] overflow-hidden relative" style={{ background: 'radial-gradient(circle, #1a1a2e 0%, #0d0d1a 100%)' }}>
                  <img
                    src={dress.imageUrl || `https://images.unsplash.com/photo-1518622358385-8ea7d0794bf6?w=400&h=533&fit=crop&q=80`}
                    alt={dress.name}
                    className="w-full h-full object-contain drop-shadow-2xl"
                    style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.5))' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1518622358385-8ea7d0794bf6?w=400&h=533&fit=crop&q=80`;
                    }}
                  />
                </div>
                <div className="p-3">
                  <p className="text-white font-medium truncate">{dress.name}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => openEdit(dress)}
                      className="flex-1 px-3 py-1.5 text-xs text-blue-400 hover:text-white hover:bg-blue-600 border border-blue-500/30 hover:border-blue-600 rounded-lg transition-all text-center"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(dress.id)}
                      disabled={deletingId === dress.id}
                      className="flex-1 px-3 py-1.5 text-xs text-red-400 hover:text-white hover:bg-red-600 border border-red-500/30 hover:border-red-600 rounded-lg transition-all disabled:opacity-50 text-center"
                    >
                      {deletingId === dress.id ? '...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
