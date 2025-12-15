
import React, { useState } from 'react';
import { analyzeTrends } from '../services/gemini';
import { TrendResult } from '../types';
import { TrendingUp, Search, Loader2, ExternalLink, DollarSign, BarChart2, Zap, Globe, Package } from 'lucide-react';

const Trends: React.FC = () => {
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TrendResult | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) return;
    
    setLoading(true);
    setData(null);
    try {
      const result = await analyzeTrends(category);
      setData(result);
    } catch (error) {
      alert("Erro ao buscar tendências. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const getOpportunityColor = (level: string) => {
    switch (level) {
      case 'Alta': return 'bg-green-100 text-green-700 border-green-200';
      case 'Média': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Baixa': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const renderProductLink = (prod: string, idx: number, marketplaceContext?: string) => (
    <li key={idx}>
        <a 
        href={`https://www.google.com/search?q=${encodeURIComponent(prod + (marketplaceContext ? " " + marketplaceContext : ""))}&tbm=shop`}
        target="_blank" 
        rel="noreferrer"
        className="flex items-start text-slate-600 text-sm bg-white p-3 rounded shadow-sm hover:shadow-md hover:bg-blue-50 hover:text-blue-700 transition-all cursor-pointer group border border-transparent hover:border-blue-100"
        title="Ver anúncios no Google Shopping"
        >
        <span className="font-mono text-blue-500 mr-3 font-bold text-xs mt-0.5">{idx + 1}.</span>
        <span className="flex-1 font-medium">{prod}</span>
        <ExternalLink size={14} className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400 mt-0.5" />
        </a>
    </li>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
       <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Tendências de Mercado</h1>
        <p className="text-slate-600 mt-2">
          Descubra o que está em alta no Brasil utilizando dados atualizados via Google Search.
        </p>
      </div>

      {/* Search Input */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Ex: Eletrônicos, Moda Praia, Ferramentas..."
              className="w-full h-12 px-4 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-lg"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !category}
            className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Search />}
            <span className="hidden md:inline ml-2">Pesquisar</span>
          </button>
        </form>
      </div>

      {loading && (
        <div className="text-center py-20">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
          <h3 className="text-xl font-medium text-slate-800">Analisando o mercado brasileiro...</h3>
          <p className="text-slate-500">Consultando Mercado Livre, Amazon e Shopee em tempo real.</p>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Overview Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Análise: {category}</h2>
                <p className="text-slate-600">{data.overview}</p>
              </div>
              <div className={`shrink-0 px-4 py-2 rounded-full border text-sm font-bold uppercase tracking-wide ${getOpportunityColor(data.opportunityLevel)}`}>
                Oportunidade: {data.opportunityLevel}
              </div>
            </div>

            {/* General Trends + Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                <div className="flex items-center text-slate-700 font-semibold mb-3">
                  <TrendingUp size={20} className="mr-2 text-blue-600" />
                  Top Produtos (Visão Geral)
                </div>
                <ul className="space-y-2">
                  {data.trendingProducts.map((prod, i) => renderProductLink(prod, i))}
                </ul>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                  <div className="flex items-center text-slate-700 font-semibold mb-2">
                    <DollarSign size={20} className="mr-2 text-green-600" />
                    Ticket Médio Estimado
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{data.priceRange}</p>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                  <div className="flex items-center text-slate-700 font-semibold mb-2">
                    <BarChart2 size={20} className="mr-2 text-purple-600" />
                    Fontes Consultadas
                  </div>
                  <div className="text-xs text-slate-500 space-y-1">
                    {data.sources.slice(0, 3).map((source, i) => (
                      <a 
                        key={i} 
                        href={source.uri} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center hover:text-blue-600 hover:underline truncate"
                      >
                        <ExternalLink size={10} className="mr-1 shrink-0" />
                        {source.title}
                      </a>
                    ))}
                    {data.sources.length === 0 && <span className="italic">IA knowledge base</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Marketplace Specific Breakdown */}
            {data.marketplaceSpecifics && (
                <div className="border-t border-slate-100 pt-8">
                    <h3 className="text-xl font-bold text-slate-800 mb-6">Top Produtos por Marketplace</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* Mercado Livre Column */}
                        <div className="bg-yellow-50 rounded-xl border border-yellow-200 overflow-hidden">
                            <div className="bg-yellow-400 p-4 flex items-center text-yellow-900 font-bold">
                                <Zap size={20} className="mr-2 fill-yellow-900 text-yellow-900" />
                                Mercado Livre
                            </div>
                            <div className="p-4">
                                <ul className="space-y-2">
                                    {data.marketplaceSpecifics.mercadoLivre?.length > 0 ? (
                                        data.marketplaceSpecifics.mercadoLivre.map((prod, i) => renderProductLink(prod, i, "Mercado Livre"))
                                    ) : (
                                        <p className="text-sm text-slate-500 italic">Nenhum dado específico encontrado.</p>
                                    )}
                                </ul>
                            </div>
                        </div>

                        {/* Amazon Column */}
                        <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                            <div className="bg-slate-800 p-4 flex items-center text-white font-bold">
                                <Globe size={20} className="mr-2" />
                                Amazon
                            </div>
                            <div className="p-4">
                                <ul className="space-y-2">
                                    {data.marketplaceSpecifics.amazon?.length > 0 ? (
                                        data.marketplaceSpecifics.amazon.map((prod, i) => renderProductLink(prod, i, "Amazon"))
                                    ) : (
                                        <p className="text-sm text-slate-500 italic">Nenhum dado específico encontrado.</p>
                                    )}
                                </ul>
                            </div>
                        </div>

                         {/* Shopee Column */}
                         <div className="bg-orange-50 rounded-xl border border-orange-200 overflow-hidden">
                            <div className="bg-orange-500 p-4 flex items-center text-white font-bold">
                                <Package size={20} className="mr-2" />
                                Shopee
                            </div>
                            <div className="p-4">
                                <ul className="space-y-2">
                                    {data.marketplaceSpecifics.shopee?.length > 0 ? (
                                        data.marketplaceSpecifics.shopee.map((prod, i) => renderProductLink(prod, i, "Shopee"))
                                    ) : (
                                        <p className="text-sm text-slate-500 italic">Nenhum dado específico encontrado.</p>
                                    )}
                                </ul>
                            </div>
                        </div>

                    </div>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Trends;