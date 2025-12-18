
import React from 'react';
import { LayoutDashboard, Search, TrendingUp, ShoppingBag, Menu, X, BookOpen, PenTool, Map, Users, LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navItems = [
    { icon: <LayoutDashboard size={20} />, name: 'Dashboard', path: '/' },
    { icon: <Search size={20} />, name: 'Analisador de Anúncios', path: '/analyzer' },
    { icon: <PenTool size={20} />, name: 'Criador Mágico', path: '/listing-wizard' },
    { icon: <TrendingUp size={20} />, name: 'Gestor de ADS', path: '/ads-manager' },
    { icon: <Map size={20} />, name: 'Radar de Mercado', path: '/market-radar' },
    { icon: <BookOpen size={20} />, name: 'Catálogo ML', path: '/catalog' },
    { icon: <Map size={20} />, name: 'Mapa de Demanda', path: '/geo-trends' },
  ];

  if (user?.role === 'admin') {
    navItems.push({ name: 'Gestão de Usuários', path: '/users', icon: <Users size={20} /> });
  }

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar Content */}
      <aside
        className={`fixed top-0 left-0 z-30 h-full w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static shrink-0 flex flex-col`}
      >
        <div className="h-16 flex items-center px-6 border-b border-slate-700">
          <ShoppingBag className="text-blue-400 mr-2" size={24} />
          <span className="text-xl font-bold tracking-tight">MarketPulse</span>
          <button
            className="ml-auto md:hidden text-slate-400 hover:text-white"
            onClick={() => setIsOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        {/* User Profile Snippet */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => window.innerWidth < 768 && setIsOpen(false)}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive(item.path)
                ? 'bg-blue-600 text-white font-medium shadow-lg shadow-blue-900/50'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700 space-y-2">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-red-400 hover:bg-slate-800 hover:text-red-300 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut size={18} className="mr-3" />
            Sair
          </button>

          <div className="bg-slate-800 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">Status da API</p>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-sm font-medium text-green-400">Online</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
