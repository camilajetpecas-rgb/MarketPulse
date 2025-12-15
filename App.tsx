
import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Menu } from 'lucide-react';

import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Analyzer from './pages/Analyzer';
import Trends from './pages/Trends';
import Catalog from './pages/Catalog';
import TitleBuilder from './pages/TitleBuilder';
import GeoTrends from './pages/GeoTrends';
import Login from './pages/Login';
import UserManagement from './pages/UserManagement';
import { AuthProvider, useAuth } from './context/AuthContext';

// Componente Layout Protegido
const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-slate-50 text-slate-400">Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between shrink-0">
            <span className="font-bold text-lg text-slate-800">MarketPulse</span>
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <Menu size={24} />
          </button>
        </div>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
        <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
              <Route path="/analyzer" element={<ProtectedLayout><Analyzer /></ProtectedLayout>} />
              <Route path="/title-builder" element={<ProtectedLayout><TitleBuilder /></ProtectedLayout>} />
              <Route path="/trends" element={<ProtectedLayout><Trends /></ProtectedLayout>} />
              <Route path="/catalog" element={<ProtectedLayout><Catalog /></ProtectedLayout>} />
              <Route path="/geo-trends" element={<ProtectedLayout><GeoTrends /></ProtectedLayout>} />
              <Route path="/users" element={<ProtectedLayout><UserManagement /></ProtectedLayout>} />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    </AuthProvider>
  );
};

export default App;
