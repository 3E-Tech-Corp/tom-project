import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface NavItem {
  path: string;
  label: string;
  requiresAuth?: boolean;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { path: '/', label: '👗 Catalog' },
  { path: '/dashboard', label: '📊 Dashboard', requiresAuth: true },
  { path: '/selections', label: '💕 My Selections', requiresAuth: true },
  { path: '/admin/dresses', label: '🛠️ Manage Dresses', adminOnly: true },
];

export default function Layout() {
  const { user, isAuthenticated, logout } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const visibleNavItems = navItems.filter(item => {
    if (item.adminOnly) return isAdmin;
    if (item.requiresAuth) return isAuthenticated;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white">👗 Dress Shop</h1>
          <p className="text-xs text-rose-400 mt-1">Tom's Collection</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-rose-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700">
          {isAuthenticated ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">{user?.username}</p>
                <p className="text-xs text-gray-400">{user?.role}</p>
              </div>
              <button
                onClick={logout}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="block w-full text-center px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
