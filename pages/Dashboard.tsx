
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, TrendingUp, ArrowRight, Activity, ShoppingCart, Users, Zap, Truck, Package, CreditCard, Award, Globe, Wrench, AlertCircle, Layers, Loader2 } from 'lucide-react';
import { analyzeTrends } from '../services/gemini';

const Dashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('Autopeças');
  const [currentCategory, setCurrentCategory] = useState('Autopeças');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Estado inicial com dados de exemplo de Autopeças para a primeira carga
  const [trends, setTrends] = useState([
    { name: 'Kit Lâmpada Super LED', trend: 'Alta', platform: 'Shopee/ML' },
    { name: 'Óleo Sintético 5W30', trend: 'Estável', platform: 'Amazon/ML' },
    { name: 'Palhetas Limpador Para-brisa', trend: 'Sazonal', platform: 'Mercado Livre' },
    { name: 'Kit Embreagem (Linha Leve)', trend: 'Alta', platform: 'Mercado Livre' },
    { name: 'Multimídia Android Universal', trend: 'Crescente', platform: 'Shopee' },
  ]);

  // Dicas específicas por categoria (base de conhecimento fixa)
  const CATEGORY_TIPS: Record<string, { title: string, content: string, items: string[] }> = {
    'Autopeças': {
      title: 'Dica de Ouro: Compatibilidade',
      content: 'Em autopeças, o maior motivo de devolução é a incompatibilidade.',
      items: ['Sempre inclua "Serve em: [Carros]"', 'Use o Part Number no título']
    },
    'Celulares e Telefones': {
      title: 'Dica de Ouro: Ficha Técnica',
      content: 'Compradores de celulares filtram muito por memória, processador e câmera.',
      items: ['Preencha todos os atributos da ficha técnica', 'Destaque a condição (Novo/Vitrine)']
    },
    'Moda e Acessórios': {
       title: 'Dica de Ouro: Tabela de Medidas',
       content: 'O maior problema em moda é o tamanho errado e devoluções por caimento.',
       items: ['Disponibilize o Guia de Tamanhos oficial', 'Fotos reais no corpo ajudam na conversão']
    },
    'Casa, Móveis e Decoração': {
        title: 'Dica de Ouro: Dimensões e Material',
        content: 'Evite frustrações mostrando o produto no ambiente para noção de escala.',
        items: ['Use fotos ambientadas', 'Descreva o material com detalhes (ex: MDF vs Madeira)']
    },
    'Eletrônicos, Áudio e Vídeo': {
        title: 'Dica de Ouro: Conectividade',
        content: 'O cliente precisa saber se vai funcionar com o que ele já tem.',
        items: ['Mostre fotos das entradas/saídas', 'Especifique Voltagem (110v/220v/Bivolt)']
    }
  };

  const getTipForCategory = (cat: string) => {
      // Tenta match exato
      if (CATEGORY_TIPS[cat]) return CATEGORY_TIPS[cat];
      
      // Fallback genérico inteligente
      return {
          title: `Estratégia para ${cat}`,
          content: 'Para categorias competitivas, o segredo é a diferenciação na oferta.',
          items: ['Use fotos de alta resolução com fundo branco', 'Responda perguntas em menos de 10 min', 'Ofereça envio Full se disponível']
      };
  };

  const currentTip = getTipForCategory(currentCategory);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsUpdating(true);
    setCurrentCategory(searchTerm); // Atualiza o título visualmente

    try {
        const result = await analyzeTrends(searchTerm);
        
        // Mapeia os resultados da IA para o formato da tabela do Dashboard
        const newTrends = result.trendingProducts.slice(0, 5).map(product => {
            let platforms = [];
            if (result.marketplaceSpecifics?.mercadoLivre?.some(i => i.toLowerCase().includes(product.toLowerCase()))) platforms.push('ML');
            if (result.marketplaceSpecifics?.amazon?.some(i => i.toLowerCase().includes(product.toLowerCase()))) platforms.push('Amazon');
            if (result.marketplaceSpecifics?.shopee?.some(i => i.toLowerCase().includes(product.toLowerCase()))) platforms.push('Shopee');
            
            const platformStr = platforms.length > 0 ? platforms.join('/') : 'Mercado Livre/Geral';
            
            return {
                name: product,
                trend: 'Alta', 
                platform: platformStr
            };
        });

        if (newTrends.length > 0) {
            setTrends(newTrends);
        }
    } catch (error) {
        console.error("Erro ao atualizar categoria:", error);
    } finally {
        setIsUpdating(false);
    }
  };

  const marketplaces = [
    {
      name: 'Mercado Livre',
      logoColor: 'text-yellow-500',
      bgHeader: 'bg-gradient-to-r from-yellow-400 to-yellow-500',
      bgBody: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      icon: <Zap className="text-white" size={24} />,
      stats: [
        { label: 'Comissão Clássico', value: '10% a 14%' },
        { label: 'Comissão Premium', value: '15% a 19%' },
        { label: 'Frete Grátis', value: '> R$ 79,00' },
        { label: 'Custo Fixo', value: 'R$ 6,00 (< R$ 79)' },
      ],
      highlight: 'O Fulfillment (Full) é o maior fator de ranqueamento orgânico hoje.',
      highlightIcon: <Truck size={16} className="text-yellow-700" />
    },
    {
      name: 'Amazon Brasil',
      logoColor: 'text-slate-800',
      bgHeader: 'bg-gradient-to-r from-slate-700 to-slate-900',
      bgBody: 'bg-slate-50',
      borderColor: 'border-slate-200',
      icon: <Globe className="text-white" size={24} />,
      stats: [
        { label: 'Comissão Média', value: '8% a 15%' },
        { label: 'Plano Profissional', value: 'R$ 19,00/mês' },
        { label: 'FBA (Logística)', value: 'Disponível' },
        { label: 'Custo Fixo', value: 'Isento no Pro' },
      ],
      highlight: 'Clientes Prime gastam 2x mais e priorizam entrega rápida FBA.',
      highlightIcon: <Award size={16} className="text-slate-700" />
    },
    {
      name: 'Shopee',
      logoColor: 'text-orange-500',
      bgHeader: 'bg-gradient-to-r from-orange-500 to-red-500',
      bgBody: 'bg-orange-50',
      borderColor: 'border-orange-200',
      icon: <Package className="text-white" size={24} />,
      stats: [
        { label: 'Comissão Padrão', value: '14% + R$ 3' },
        { label: 'Prog. Frete Grátis', value: '+ 6% (Total 20%)' },
        { label: 'Frete Grátis', value: 'Via Cupom' },
        { label: 'Teto Comissão', value: 'R$ 100/item' },
      ],
      highlight: 'Lives e Datas Duplas (9.9, 10.10) geram picos massivos de tráfego.',
      highlightIcon: <Activity size={16} className="text-orange-700" />
    }
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Bem-vindo, Vendedor!</h1>
        <p className="text-slate-600 mt-2">
          Aqui está o resumo do mercado hoje. O que você gostaria de analisar?
        </p>
      </header>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <Link to="/analyzer" className="group relative overflow-hidden bg-blue-600 rounded-2xl p-6 text-white shadow-lg hover:bg-blue-700 transition-all transform hover:-translate-y-1">
          <div className="relative z-10">
            <div className="bg-white/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Search className="text-white" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Analisar Novo Anúncio</h3>
            <p className="text-blue-100 text-sm mb-4 max-w-xs">
              Obtenha insights de IA para melhorar seus títulos, descrições e SEO.
            </p>
            <div className="flex items-center font-medium text-sm">
              Começar agora <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
        </Link>

        <Link to="/trends" className="group relative overflow-hidden bg-slate-800 rounded-2xl p-6 text-white shadow-lg hover:bg-slate-700 transition-all transform hover:-translate-y-1">
          <div className="relative z-10">
             <div className="bg-white/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="text-purple-300" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Descobrir Tendências</h3>
            <p className="text-slate-300 text-sm mb-4 max-w-xs">
              Pesquise categorias para ver o que está vendendo no Brasil em tempo real.
            </p>
             <div className="flex items-center font-medium text-sm text-purple-300">
              Explorar mercado <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
           <div className="absolute bottom-0 right-0 -mb-8 -mr-8 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl"></div>
        </Link>
      </div>

      {/* Dynamic Category Spotlight Section */}
      <div className="mb-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4">
            <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center mb-1">
                    {currentCategory === 'Autopeças' ? (
                        <Wrench className="mr-2 text-slate-500" />
                    ) : (
                        <Layers className="mr-2 text-slate-500" />
                    )}
                    Destaque da Categoria
                </h2>
                <p className="text-sm text-slate-500">
                    Veja os produtos mais vendidos em tempo real para qualquer segmento.
                </p>
            </div>
            
            {/* SEARCH INPUT */}
            <form onSubmit={handleSearch} className="relative w-full sm:w-[320px] flex gap-2">
                <div className="relative flex-1">
                    <input 
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Digite uma categoria..."
                        disabled={isUpdating}
                        className="w-full bg-white border border-slate-300 text-slate-700 py-2.5 pl-4 pr-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium shadow-sm transition-all text-sm disabled:opacity-70"
                    />
                </div>
                <button 
                    type="submit"
                    disabled={isUpdating || !searchTerm}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg transition-colors disabled:opacity-70"
                >
                    {isUpdating ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                </button>
            </form>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trending Products List */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col min-h-[320px]">
             <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 flex items-center truncate max-w-[70%]">
                   <Activity size={20} className="mr-2 text-blue-600" /> 
                   Mais Vendidos: <span className="ml-1 text-blue-700">{currentCategory}</span>
                </h3>
                <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-1 rounded shrink-0">
                   Atualizado
                </span>
             </div>
             <div className="overflow-x-auto flex-1 relative">
                {isUpdating && (
                    <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center backdrop-blur-sm transition-all">
                        <div className="flex flex-col items-center">
                            <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
                            <span className="text-sm font-medium text-slate-600">Buscando tendências...</span>
                        </div>
                    </div>
                )}
                <table className="w-full text-sm text-left">
                   <thead className="bg-slate-50 text-slate-500">
                      <tr>
                         <th className="px-4 py-2 rounded-l-lg">Produto</th>
                         <th className="px-4 py-2">Tendência</th>
                         <th className="px-4 py-2 rounded-r-lg">Marketplace Forte</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {trends.map((item, idx) => (
                         <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-medium text-slate-700">{item.name}</td>
                            <td className="px-4 py-3">
                               <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${item.trend === 'Alta' || item.trend === 'Crescente' ? 'bg-green-100 text-green-800' : 'bg-blue-50 text-blue-700'}`}>
                                  {item.trend === 'Alta' && <TrendingUp size={12} className="mr-1" />}
                                  {item.trend}
                               </span>
                            </td>
                            <td className="px-4 py-3 text-slate-500">{item.platform}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>

          {/* Strategic Insight */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-sm border border-slate-700 p-6 text-white flex flex-col justify-between">
             <div className={`transition-opacity duration-300 ${isUpdating ? 'opacity-50' : 'opacity-100'}`}>
                <h3 className="font-bold text-lg mb-4 flex items-center text-yellow-400">
                   <AlertCircle size={20} className="mr-2" />
                   {currentTip.title}
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-4">
                   {currentTip.content}
                </p>
                <ul className="text-sm space-y-3 text-slate-200">
                   {currentTip.items.map((tip, i) => (
                    <li key={i} className="flex items-start">
                        <span className="mr-2 text-green-400">•</span>
                        {tip}
                    </li>
                   ))}
                </ul>
             </div>
             <div className="mt-6 pt-4 border-t border-slate-700">
                <Link to="/trends" className="text-sm text-blue-300 hover:text-white flex items-center font-medium transition-colors">
                   Ver análise completa de {currentCategory} <ArrowRight size={14} className="ml-1" />
                </Link>
             </div>
          </div>
        </div>
      </div>

      {/* Marketplaces Intelligence Section */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
          <CreditCard className="mr-2 text-slate-500" />
          Panorama dos Marketplaces (Guia Rápido)
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {marketplaces.map((mk, idx) => (
            <div key={idx} className={`rounded-xl border ${mk.borderColor} overflow-hidden shadow-sm hover:shadow-md transition-shadow`}>
              {/* Card Header */}
              <div className={`${mk.bgHeader} p-4 flex items-center justify-between`}>
                <span className="font-bold text-white text-lg">{mk.name}</span>
                <div className="bg-white/20 p-2 rounded-lg">
                  {mk.icon}
                </div>
              </div>
              
              {/* Card Body */}
              <div className="bg-white p-5 space-y-4">
                <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                  {mk.stats.map((stat, i) => (
                    <div key={i} className="flex flex-col">
                      <span className="text-xs text-slate-400 font-medium uppercase">{stat.label}</span>
                      <span className="text-sm font-semibold text-slate-700">{stat.value}</span>
                    </div>
                  ))}
                </div>
                
                <div className={`mt-4 ${mk.bgBody} p-3 rounded-lg border ${mk.borderColor}`}>
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 shrink-0">{mk.highlightIcon}</div>
                    <p className="text-xs font-medium text-slate-700 leading-relaxed">
                      {mk.highlight}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Overview (Mock Data) */}
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
        <Activity className="mr-2 text-slate-500" />
        Suas Estatísticas
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 text-sm font-medium">Anúncios Analisados</span>
            <Activity size={20} className="text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900">24</p>
          <p className="text-xs text-green-600 mt-1 flex items-center">
            <span className="bg-green-100 px-1.5 py-0.5 rounded mr-1">+12%</span> esta semana
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 text-sm font-medium">Marketplaces Ativos</span>
            <ShoppingCart size={20} className="text-yellow-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900">3</p>
          <p className="text-xs text-slate-400 mt-1">ML, Amazon, Shopee</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 text-sm font-medium">Concorrência</span>
            <Users size={20} className="text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900">Alta</p>
          <p className="text-xs text-slate-400 mt-1">Baseado nas últimas buscas</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
