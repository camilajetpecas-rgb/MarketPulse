
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/auth';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Lock, Mail, Loader2, AlertCircle, HelpCircle, RefreshCw } from 'lucide-react';

const Login: React.FC = () => {
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
        // Pequeno delay para simular requisição e feedback visual
        await new Promise(resolve => setTimeout(resolve, 800));

        // Fluxo de Login Estrito
        const success = await login(email, password);
        if (success) {
            navigate('/');
        } else {
            setError('E-mail ou senha inválidos.');
        }
    } catch (err: any) {
        setError(err.message || "Ocorreu um erro inesperado.");
    } finally {
        setLoading(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Tem certeza? Isso irá apagar todos os usuários cadastrados e restaurar as senhas originais (senha: "admin").')) {
        authService.resetSystem();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-blue-100 p-3 rounded-xl mb-4">
                <ShoppingBag className="text-blue-600" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">MarketPulse Brasil</h1>
            <p className="text-slate-500 text-sm mt-2 text-center">
                Área restrita. Faça login para acessar.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2 ml-1">E-mail Corporativo</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-slate-800"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2 ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-slate-800"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={4}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center text-red-600 bg-red-50 p-3 rounded-lg text-sm border border-red-100 animate-in shake">
                <AlertCircle size={16} className="mr-2 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-lg transition-colors flex items-center justify-center shadow-lg shadow-blue-200 disabled:opacity-70"
            >
              {loading ? (
                  <Loader2 className="animate-spin" />
              ) : (
                  'Entrar na Plataforma'
              )}
            </button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 mb-4">
                Não possui acesso? Entre em contato com o administrador do sistema.
            </p>
          </div>

          {/* Painel de Credenciais de Demonstração */}
          <div className="mt-4 bg-slate-50 rounded-xl p-5 border border-slate-200">
            <div className="flex items-center text-slate-800 font-bold mb-3 text-sm">
                <HelpCircle size={16} className="mr-2 text-blue-500" />
                Credenciais de Acesso (Demo)
            </div>
            <div className="space-y-3 text-sm">
                <div className="flex flex-col space-y-1">
                <span className="text-slate-500 text-xs uppercase font-bold">Admin</span>
                <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-200 shadow-sm cursor-pointer hover:border-blue-300 transition-colors" onClick={() => { setEmail('admin@marketpulse.com'); setPassword('admin'); }}>
                    <code className="text-slate-700 text-xs sm:text-sm">admin@marketpulse.com</code>
                    <span className="text-slate-400 text-xs bg-slate-100 px-1.5 py-0.5 rounded">Senha: <b>admin</b></span>
                </div>
                </div>
                <div className="flex flex-col space-y-1">
                <span className="text-slate-500 text-xs uppercase font-bold">Camila</span>
                <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-200 shadow-sm cursor-pointer hover:border-blue-300 transition-colors" onClick={() => { setEmail('camilajetpecas@gmail.com'); setPassword('admin'); }}>
                    <code className="text-slate-700 text-xs sm:text-sm truncate mr-2">camilajetpecas@gmail.com</code>
                    <span className="text-slate-400 text-xs bg-slate-100 px-1.5 py-0.5 rounded whitespace-nowrap">Senha: <b>admin</b></span>
                </div>
                </div>
            </div>
            
            <button
                onClick={handleReset}
                className="w-full mt-4 flex items-center justify-center text-xs text-slate-500 hover:text-red-600 transition-colors py-2 hover:bg-red-50 rounded"
            >
                <RefreshCw size={12} className="mr-1.5" />
                Esqueceu a senha? Restaurar Padrões
            </button>
            </div>

        </div>
        <div className="bg-slate-50 p-4 text-center border-t border-slate-100 text-xs text-slate-500">
            &copy; 2025 MarketPulse Intelligence
        </div>
      </div>
    </div>
  );
};

export default Login;
