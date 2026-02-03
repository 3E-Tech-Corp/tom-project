import { useState, useEffect, useMemo } from 'react';
import { dressApi, type Dress, type DressCategory, type CreateDressRequest } from '../services/api';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const COLORS = [
  'Black', 'White', 'Red', 'Pink', 'Blue', 'Navy',
  'Green', 'Purple', 'Gold', 'Silver', 'Ivory', 'Burgundy',
];

const emptyDress: CreateDressRequest = {
  name: '', description: '', imageUrl: '', category: '',
  size: 'M', color: 'Black', price: 0, inStock: true,
};

export default function AdminDresses() {
  const [dresses, setDresses] = useState<Dress[]>([]);
  const [categories, setCategories] = useState<DressCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CreateDressRequest>(emptyDress);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [imagePreviewStatus, setImagePreviewStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [d, c] = await Promise.all([dressApi.list(), dressApi.categories()]);
      setDresses(d);
      setCategories(c);
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
    if (!form.category) { setError('Category is required'); return; }
    if (form.price <= 0) { setError('Price must be greater than 0'); return; }

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
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                  placeholder="A stunning floor-length gown with sequin details..."
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
                  placeholder="https://picsum.photos/400/533"
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
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => updateField('category', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="">Select category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.price || ''}
                    onChange={(e) => updateField('price', Number(e.target.value))}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="99.99"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Size</label>
                  <select
                    value={form.size}
                    onChange={(e) => updateField('size', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    {SIZES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Color</label>
                  <select
                    value={form.color}
                    onChange={(e) => updateField('color', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    {COLORS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.inStock}
                  onChange={(e) => updateField('inStock', e.target.checked)}
                  className="rounded border-gray-600 bg-gray-700 text-rose-500 focus:ring-rose-500"
                />
                <span className="text-sm text-gray-300">In Stock</span>
              </label>
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
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Dress</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400 hidden md:table-cell">Category</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400 hidden md:table-cell">Size</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Price</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400 hidden sm:table-cell">Stock</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {dresses.map(dress => (
                <tr key={dress.id} className="hover:bg-gray-750 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={dress.imageUrl || `https://images.unsplash.com/photo-1518622358385-8ea7d0794bf6?w=80&h=80&fit=crop&q=80`}
                        alt={dress.name}
                        className="w-10 h-10 rounded-lg object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1518622358385-8ea7d0794bf6?w=80&h=80&fit=crop&q=80`;
                        }}
                      />
                      <div>
                        <p className="text-white font-medium">{dress.name}</p>
                        <p className="text-gray-400 text-xs">{dress.color}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="px-2 py-1 bg-rose-600/20 text-rose-400 rounded-full text-xs font-medium">
                      {dress.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-300 hidden md:table-cell">{dress.size}</td>
                  <td className="px-6 py-4 text-rose-400 font-semibold">${dress.price.toFixed(2)}</td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <span className={`text-xs font-medium ${dress.inStock ? 'text-green-400' : 'text-red-400'}`}>
                      {dress.inStock ? '✓ In Stock' : '✗ Out'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(dress)}
                        className="px-3 py-1.5 text-xs text-blue-400 hover:text-white hover:bg-blue-600 border border-blue-500/30 hover:border-blue-600 rounded-lg transition-all"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(dress.id)}
                        disabled={deletingId === dress.id}
                        className="px-3 py-1.5 text-xs text-red-400 hover:text-white hover:bg-red-600 border border-red-500/30 hover:border-red-600 rounded-lg transition-all disabled:opacity-50"
                      >
                        {deletingId === dress.id ? '...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
