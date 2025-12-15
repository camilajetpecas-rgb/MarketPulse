
import React, { useState } from 'react';
import { searchMercadoLivreCatalog } from '../services/gemini';
import { CatalogItem } from '../types';
import { Search, Loader2, Award, AlertCircle, ShoppingBag, ExternalLink, Zap } from 'lucide-react';

const Catalog: React.FC = () => {
  // Campo inicia vazio conforme solicitado
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Removido useEffect de busca automática

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!category) return;

    setLoading(true);
    setItems([]);
    try {
      const results = await searchMercadoLivreCatalog(category);
      setItems(results);
      setHasSearched(true);
    } catch (error) {
      alert("Erro ao buscar dados do catálogo. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const getCompetitionColor = (level: string) => {
    switch (level) {
      case 'Extrema': return 'text-red-700 bg-red-100 border-red-200';
      case 'Alta': return 'text-orange-700 bg-orange-100 border-orange-200';
      case 'Média': return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'Baixa': return 'text-green-700 bg-green-100 border-green-200';
      default: return 'text-slate-700 bg-slate-100';
    }
  };

  // Função Avançada de Limpeza de URL para garantir link direto
  const getDestinationUrl = (item: CatalogItem) => {
    let url = (item.productUrl || '').trim();
    
    // 1. Decodificar link de rastreamento do Google se necessário
    if (url.includes('google.com/url') || url.includes('google.com.br/url')) {
        try {
            const urlObj = new URL(url);
            const realUrl = urlObj.searchParams.get('url') || urlObj.searchParams.get('q');
            if (realUrl) {
                url = realUrl;
            }
        } catch (e) {
            // Se falhar o parse, mantém a original
        }
    }

    // 2. LIMPEZA DE PARÂMETROS DE RASTREAMENTO (A CORREÇÃO DEFINITIVA)
    // Remove tudo após o '?' para garantir que params gigantes (gclid, matt_tool) não quebrem o header
    if (url.includes('?')) {
        url = url.split('?')[0];
    }

    // 3. Se for um link válido do ML, usa ele diretamente
    if (url.includes('mercadolivre.com')) {
        return url;
    }
    
    // 4. Fallback: Se não tiver URL, usa a busca interna do ML (Melhor que ir pro Google)
    // Isso garante que o usuário caia no marketplace, mesmo que numa lista
    return `https://lista.mercadolivre.com.br/${encodeURIComponent(item.productName)}`;
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center">
            <Zap className="mr-3 text-yellow-500 fill-yellow-500" />
            Explorador de Catálogo ML
        </h1>
        <p className="text-slate-600 mt-2 max-w-2xl">
          Identifique produtos que estão no <strong>Catálogo (Buy Box)</strong> do Mercado Livre. 
          Nesta modalidade, vence quem tem o melhor preço, entrega (Full) e reputação.
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3.5 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Digite a categoria para pesquisar (ex: Peças de Suspensão)"
              className="w-full h-12 pl-10 pr-4 rounded-lg border border-slate-300 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition text-lg"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !category}
            className="h-12 px-8 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-yellow-200"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Analisar Catálogo'}
          </button>
        </form>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setCategory("Peças de Carros e Caminhonetes")} className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-full text-slate-600 transition">
                Peças Automotivas
            </button>
            <button onClick={() => setCategory("Suspensão e Direção")} className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-full text-slate-600 transition">
                Suspensão
            </button>
             <button onClick={() => setCategory("Iluminação Automotiva")} className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-full text-slate-600 transition">
                Iluminação
            </button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <Loader2 className="animate-spin text-yellow-500 mx-auto mb-4" size={48} />
          <h3 className="text-xl font-medium text-slate-800">Varrendo o Catálogo...</h3>
          <p className="text-slate-500 mt-2">Identificando produtos "Winner" e faixas de preço competitivas.</p>
        </div>
      )}

      {!loading && !hasSearched && (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-100">
              <ShoppingBag size={48} className="mx-auto text-slate-200 mb-4" />
              <h3 className="text-lg font-medium text-slate-600">Aguardando Pesquisa</h3>
              <p className="text-slate-400 mt-1 max-w-md mx-auto">Digite uma categoria acima para ver quais produtos estão dominando o catálogo do Mercado Livre.</p>
          </div>
      )}

      {!loading && hasSearched && items.length === 0 && (
          <div className="text-center py-12">
              <ShoppingBag size={48} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">Nenhum produto de catálogo claro encontrado para essa busca.</p>
          </div>
      )}

      {!loading && items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, idx) => {
            const targetUrl = getDestinationUrl(item);

            return (
                <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                  <div className="p-5 flex-1">
                    <div className="flex justify-between items-start mb-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wide border ${getCompetitionColor(item.competitionLevel)}`}>
                            {item.competitionLevel} Competição
                        </span>
                        <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded flex items-center">
                            <Award size={12} className="mr-1" />
                            Catálogo
                        </span>
                    </div>
                    
                    <h3 className="font-bold text-slate-800 text-lg leading-tight mb-2 min-h-[3.5rem]">
                        {item.productName}
                    </h3>
                    
                    <div className="mb-4">
                        <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Preço para Ganhar (Winner)</p>
                        <p className="text-2xl font-bold text-green-600">{item.winningPrice}</p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="flex items-start">
                            <AlertCircle size={16} className="text-blue-500 mt-0.5 mr-2 shrink-0" />
                            <p className="text-sm text-slate-600 italic">
                                "{item.tipToWin}"
                            </p>
                        </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 p-3 border-t border-slate-100">
                    <a 
                        href={targetUrl} 
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center w-full text-sm font-medium text-slate-600 hover:text-yellow-600 transition-colors"
                    >
                        Ver concorrência real <ExternalLink size={14} className="ml-2" />
                    </a>
                  </div>
                </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Catalog;
