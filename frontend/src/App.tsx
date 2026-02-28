import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DressCatalog from './pages/DressCatalog';
import DressDetail from './pages/DressDetail';
import MySelections from './pages/MySelections';
import AdminDresses from './pages/AdminDresses';
import QrGenerator from './pages/QrGenerator';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== 'Admin') return <Navigate to="/" />;
  return <>{children}</>;
}

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" /> : <Login />}
      />
      {/* Public routes — no login required */}
      <Route path="/" element={<Layout />}>
        <Route index element={<DressCatalog />} />
        <Route path="catalog" element={<DressCatalog />} />
        <Route path="dresses/:id" element={<DressDetail />} />
        {/* Protected routes — login required */}
        <Route path="dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="selections" element={<PrivateRoute><MySelections /></PrivateRoute>} />
        <Route
          path="admin/dresses"
          element={
            <PrivateRoute>
              <AdminRoute>
                <AdminDresses />
              </AdminRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="admin/qr-generator"
          element={
            <PrivateRoute>
              <AdminRoute>
                <QrGenerator />
              </AdminRoute>
            </PrivateRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
