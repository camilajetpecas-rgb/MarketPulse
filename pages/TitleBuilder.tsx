
import React, { useState } from 'react';
import { generateTitleBenchmarks } from '../services/gemini';
import { Platform, TitleBenchmarkResult } from '../types';
import { PenTool, Search, Loader2, Copy, Trophy, Lightbulb, BarChart2, CheckCircle, ExternalLink, Zap, Globe, Package, Store, MapPin } from 'lucide-react';

const TitleBuilder: React.FC = () => {
  // We removed the single platform selector to always show comparison, 
  // but kept the variable if we want to filter later. Currently unused in UI but passed to service if needed.
  const [platform, setPlatform] = useState<string>('ALL'); 
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TitleBenchmarkResult | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword) return;

    setLoading(true);
    setResult(null);
    try {
      const data = await generateTitleBenchmarks(platform, keyword);
      setResult(data);
    } catch (error) {
      alert("Erro ao gerar títulos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast notification here
  };

  const getDestinationUrl = (url: string | undefined, title: string, platformContext: string) => {
    let clean = (url || '').trim();
    clean = clean.replace(/[()]/g, '');

    // 1. Decodificar link "sujo" do Google (causa do erro de Header)
    if (clean.includes('google.com/url') || clean.includes('google.com.br/url')) {
        try {
            const urlObj = new URL(clean);
            // Tenta pegar o parametro 'url' ou 'q' que contem o link real
            const realUrl = urlObj.searchParams.get('url') || urlObj.searchParams.get('q');
            if (realUrl) {
                clean = realUrl;
            }
        } catch (e) {
            // Se falhar o parse, tenta usar regex simples
            const match = clean.match(/url=([^&]+)/) || clean.match(/q=([^&]+)/);
            if (match && match[1]) {
                clean = decodeURIComponent(match[1]);
            }
        }
    }

    // 2. LIMPEZA DE PARÂMETROS DE RASTREAMENTO (A CORREÇÃO DEFINITIVA)
    // Remove tudo após o '?' para garantir que params gigantes (gclid, matt_tool) não quebrem o header
    // Mas preserva o link base do produto
    if (clean.includes('?')) {
        clean = clean.split('?')[0];
    }

    // 3. Se a URL estiver vazia após limpeza ou for muito curta, fallback
    if (clean.length < 10) {
        if (platformContext === 'Mercado Livre') return `https://lista.mercadolivre.com.br/${encodeURIComponent(title)}`;
        if (platformContext === 'Amazon') return `https://www.amazon.com.br/s?k=${encodeURIComponent(title)}`;
        if (platformContext === 'Shopee') return `https://shopee.com.br/search?keyword=${encodeURIComponent(title)}`;
        return `https://www.google.com/search?q=${encodeURIComponent(title)}`;
    }

    // 4. Adiciona protocolo se faltar
    if (!/^https?:\/\//i.test(clean)) {
        clean = 'https://' + clean;
    }

    // 5. Retorna a URL limpa (confiamos que é do marketplace)
    return clean;
  };

  // Helper to filter titles by platform
  const getTitlesByPlatform = (p: string) => {
    if (!result) return [];
    return result.competitorTitles.filter(t => t.platform.toLowerCase().includes(p.toLowerCase()));
  };

  // Helper to render value or fallback
  const renderMeta = (val: string | undefined) => {
    if (!val || val === 'N/A' || val.trim() === '') return 'Não informado';
    return val;
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center">
            <PenTool className="mr-3 text-indigo-600" />
            Criador de Títulos Otimizados
        </h1>
        <p className="text-slate-600 mt-2 max-w-2xl">
          Compare os títulos dos <strong>Top Sellers</strong> no Mercado Livre, Amazon e Shopee lado a lado e descubra padrões vencedores.
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3.5 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Digite Palavra-chave, EAN ou Referência (Ex: Aditivo Paraflu 5L)"
              className="w-full h-12 pl-10 pr-4 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition text-lg"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !keyword}
            className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-200"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Analisar Competidores'}
          </button>
        </form>
      </div>

      {loading && (
        <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
          <h3 className="text-xl font-medium text-slate-800">Varrendo Marketplaces...</h3>
          <p className="text-slate-500 mt-2">Comparando estratégias do Mercado Livre, Amazon e Shopee.</p>
        </div>
      )}

      {result && (
        <div className="space-y-8">
            
            {/* COMPARISON COLUMNS */}
            <div>
                <div className="flex items-center justify-between mb-4">
                     <h3 className="font-bold text-slate-700 flex items-center text-lg">
                        <Trophy size={20} className="mr-2 text-yellow-500" />
                        Ranking por Marketplace (O Que os Líderes Usam)
                    </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Mercado Livre */}
                    <div className="bg-yellow-50 rounded-xl border border-yellow-200 overflow-hidden flex flex-col">
                        <div className="bg-yellow-400 p-3 flex items-center text-yellow-900 font-bold text-sm">
                            <Zap size={16} className="mr-2 fill-yellow-900 text-yellow-900" />
                            Mercado Livre
                        </div>
                        <div className="p-3 space-y-3 flex-1">
                            {getTitlesByPlatform('mercado').map((item, i) => (
                                <a 
                                    key={i} 
                                    href={getDestinationUrl(item.url, item.title, 'Mercado Livre')}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block text-sm bg-white p-3 rounded border border-yellow-100 hover:border-yellow-400 hover:shadow-sm transition-all group"
                                >
                                    <div className="flex items-start">
                                        <span className="font-mono text-yellow-500 mr-2 text-xs mt-0.5 font-bold">{i+1}</span>
                                        <div className="flex-1">
                                            <span className="font-medium text-slate-700 group-hover:text-yellow-700 leading-snug block">
                                                {item.title}
                                            </span>
                                            {/* Seller Info */}
                                            <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-slate-50">
                                                <span className="flex items-center text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">
                                                    <Store size={10} className="mr-1" /> {renderMeta(item.sellerName)}
                                                </span>
                                                <span className="flex items-center text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">
                                                    <MapPin size={10} className="mr-1" /> {renderMeta(item.itemLocation)}
                                                </span>
                                            </div>
                                        </div>
                                        <ExternalLink size={12} className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-yellow-600 mt-0.5 shrink-0" />
                                    </div>
                                </a>
                            ))}
                            {getTitlesByPlatform('mercado').length === 0 && <p className="text-xs text-slate-400 italic p-2">Nenhum dado encontrado.</p>}
                        </div>
                    </div>

                    {/* Amazon */}
                    <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex flex-col">
                        <div className="bg-slate-800 p-3 flex items-center text-white font-bold text-sm">
                            <Globe size={16} className="mr-2" />
                            Amazon
                        </div>
                        <div className="p-3 space-y-3 flex-1">
                            {getTitlesByPlatform('amazon').map((item, i) => (
                                <a 
                                    key={i} 
                                    href={getDestinationUrl(item.url, item.title, 'Amazon')}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block text-sm bg-white p-3 rounded border border-slate-200 hover:border-slate-400 hover:shadow-sm transition-all group"
                                >
                                    <div className="flex items-start">
                                        <span className="font-mono text-slate-400 mr-2 text-xs mt-0.5 font-bold">{i+1}</span>
                                        <div className="flex-1">
                                            <span className="font-medium text-slate-700 group-hover:text-slate-900 leading-snug block">
                                                {item.title}
                                            </span>
                                             {/* Seller Info */}
                                             <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-slate-50">
                                                <span className="flex items-center text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">
                                                    <Store size={10} className="mr-1" /> {renderMeta(item.sellerName)}
                                                </span>
                                                <span className="flex items-center text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">
                                                    <MapPin size={10} className="mr-1" /> {renderMeta(item.itemLocation)}
                                                </span>
                                            </div>
                                        </div>
                                        <ExternalLink size={12} className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 mt-0.5 shrink-0" />
                                    </div>
                                </a>
                            ))}
                             {getTitlesByPlatform('amazon').length === 0 && <p className="text-xs text-slate-400 italic p-2">Nenhum dado encontrado.</p>}
                        </div>
                    </div>

                    {/* Shopee */}
                    <div className="bg-orange-50 rounded-xl border border-orange-200 overflow-hidden flex flex-col">
                        <div className="bg-orange-500 p-3 flex items-center text-white font-bold text-sm">
                            <Package size={16} className="mr-2" />
                            Shopee
                        </div>
                        <div className="p-3 space-y-3 flex-1">
                            {getTitlesByPlatform('shopee').map((item, i) => (
                                <a 
                                    key={i} 
                                    href={getDestinationUrl(item.url, item.title, 'Shopee')}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block text-sm bg-white p-3 rounded border border-orange-100 hover:border-orange-400 hover:shadow-sm transition-all group"
                                >
                                    <div className="flex items-start">
                                        <span className="font-mono text-orange-400 mr-2 text-xs mt-0.5 font-bold">{i+1}</span>
                                        <div className="flex-1">
                                            <span className="font-medium text-slate-700 group-hover:text-orange-700 leading-snug block">
                                                {item.title}
                                            </span>
                                             {/* Seller Info */}
                                             <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-slate-50">
                                                <span className="flex items-center text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">
                                                    <Store size={10} className="mr-1" /> {renderMeta(item.sellerName)}
                                                </span>
                                                <span className="flex items-center text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">
                                                    <MapPin size={10} className="mr-1" /> {renderMeta(item.itemLocation)}
                                                </span>
                                            </div>
                                        </div>
                                        <ExternalLink size={12} className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-orange-600 mt-0.5 shrink-0" />
                                    </div>
                                </a>
                            ))}
                             {getTitlesByPlatform('shopee').length === 0 && <p className="text-xs text-slate-400 italic p-2">Nenhum dado encontrado.</p>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Patterns */}
                <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-5">
                    <h3 className="font-bold text-indigo-900 flex items-center mb-3">
                        <BarChart2 size={18} className="mr-2" />
                        Padrões Detectados (Resumo)
                    </h3>
                    <p className="text-sm text-indigo-800 leading-relaxed">
                        {result.patternAnalysis}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {result.highVolumeKeywords.map((kw, i) => (
                            <span key={i} className="text-xs bg-white text-indigo-600 px-2 py-1 rounded border border-indigo-100 font-medium">
                                {kw}
                            </span>
                        ))}
                    </div>
                </div>

                {/* AI Suggestions */}
                <div className="bg-gradient-to-br from-white to-green-50 rounded-xl shadow-md border border-green-100 overflow-hidden">
                     <div className="bg-green-600 p-4 text-white flex items-center justify-between">
                        <h3 className="font-bold flex items-center text-lg">
                            <Lightbulb size={20} className="mr-2 text-yellow-300" />
                            Sugestões de Alta Conversão
                        </h3>
                        <span className="bg-white/20 text-xs px-2 py-1 rounded font-bold">IA Otimizada</span>
                    </div>
                    <div className="p-6 space-y-4">
                        {result.suggestedTitles.map((title, i) => (
                            <div key={i} className="group relative bg-white p-4 rounded-lg shadow-sm border border-slate-100 hover:border-green-400 hover:shadow-md transition-all cursor-pointer" onClick={() => copyToClipboard(title)}>
                                <div className="flex items-start pr-8">
                                    <span className="text-green-600 font-bold mr-3 mt-0.5">
                                        <CheckCircle size={16} />
                                    </span>
                                    <p className="text-slate-800 font-medium text-lg leading-snug">
                                        {title}
                                    </p>
                                </div>
                                <div className="absolute top-4 right-4 text-slate-300 group-hover:text-green-600 transition-colors">
                                    <Copy size={18} />
                                </div>
                                <div className="absolute bottom-2 right-4 text-[10px] text-green-600 opacity-0 group-hover:opacity-100 transition-opacity font-bold uppercase tracking-wider">
                                    Copiar
                                </div>
                            </div>
                        ))}
                        <div className="text-center pt-2">
                            <p className="text-xs text-slate-400">
                                *Clique no título para copiar para a área de transferência.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default TitleBuilder;
