import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { dressApi, selectionApi } from '../services/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ dresses: 0, selections: 0, categories: 0 });

  useEffect(() => {
    Promise.all([
      dressApi.list().then(d => d.length).catch(() => 0),
      selectionApi.list().then(s => s.length).catch(() => 0),
      dressApi.categories().then(c => c.length).catch(() => 0),
    ]).then(([dresses, selections, categories]) => {
      setStats({ dresses, selections, categories });
    });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Welcome back, {user?.username}! 👋</h1>
      <p className="text-gray-400 mb-8">Here's an overview of the dress collection</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link
          to="/catalog"
          className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-rose-500/50 hover:shadow-lg hover:shadow-rose-500/10 transition-all group"
        >
          <div className="text-3xl mb-3">👗</div>
          <h3 className="text-gray-400 text-sm font-medium">Dresses in Catalog</h3>
          <p className="text-3xl font-bold text-white mt-2">{stats.dresses}</p>
          <p className="text-rose-400 text-sm mt-2 group-hover:underline">Browse catalog →</p>
        </Link>

        <Link
          to="/selections"
          className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-rose-500/50 hover:shadow-lg hover:shadow-rose-500/10 transition-all group"
        >
          <div className="text-3xl mb-3">💕</div>
          <h3 className="text-gray-400 text-sm font-medium">My Selections</h3>
          <p className="text-3xl font-bold text-white mt-2">{stats.selections}</p>
          <p className="text-rose-400 text-sm mt-2 group-hover:underline">View selections →</p>
        </Link>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="text-3xl mb-3">🏷️</div>
          <h3 className="text-gray-400 text-sm font-medium">Categories</h3>
          <p className="text-3xl font-bold text-white mt-2">{stats.categories}</p>
          <p className="text-gray-500 text-sm mt-2">Available categories</p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-white font-semibold text-lg mb-3">✨ Getting Started</h3>
        <div className="space-y-3 text-gray-300 text-sm">
          <p>• Browse the <Link to="/catalog" className="text-rose-400 hover:underline">Dress Catalog</Link> to explore our collection</p>
          <p>• Click on any dress to see details and add it to your selections</p>
          <p>• View your saved picks in <Link to="/selections" className="text-rose-400 hover:underline">My Selections</Link></p>
          {user?.role === 'Admin' && (
            <p>• As an admin, you can <Link to="/admin/dresses" className="text-rose-400 hover:underline">manage the catalog</Link></p>
          )}
        </div>
      </div>
    </div>
  );
}
