import React, { useState } from 'react';
import { Radar, Map, TrendingUp, Search, ArrowRight, BarChart2, Globe, AlertCircle } from 'lucide-react';
import { analyzeTrends, analyzeGeoTrends, searchMercadoLivreCatalog } from '../services/gemini';
import { TrendResult, GeoTrendResult, CatalogItem } from '../types';

const MarketRadar: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'trends' | 'geo' | 'catalog'>('trends');
    const [loading, setLoading] = useState(false);
    const [keyword, setKeyword] = useState('');

    // Results State
    const [trendResult, setTrendResult] = useState<TrendResult | null>(null);
    const [geoResult, setGeoResult] = useState<GeoTrendResult | null>(null);
    const [catalogResult, setCatalogResult] = useState<CatalogItem[] | null>(null);

    const handleSearch = async () => {
        if (!keyword) return;
        setLoading(true);
        try {
            if (activeTab === 'trends') {
                const data = await analyzeTrends(keyword);
                setTrendResult(data);
            } else if (activeTab === 'geo') {
                const data = await analyzeGeoTrends(keyword);
                setGeoResult(data);
            } else if (activeTab === 'catalog') {
                const data = await searchMercadoLivreCatalog(keyword);
                setCatalogResult(data);
            }
        } catch (error) {
            console.error(error);
            alert("Erro ao realizar pesquisa de mercado. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center">
                        <Radar className="mr-3 text-emerald-500" /> Radar de Mercado
                    </h1>
                    <p className="text-slate-600 mt-1">
                        Inteligência competitiva profunda: Tendências, Geolocalização e Catálogo.
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('trends')}
                    className={`px-6 py-3 font-medium text-sm flex items-center transition-colors ${activeTab === 'trends' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <TrendingUp size={16} className="mr-2" /> Tendências de Mercado
                </button>
                <button
                    onClick={() => setActiveTab('geo')}
                    className={`px-6 py-3 font-medium text-sm flex items-center transition-colors ${activeTab === 'geo' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Map size={16} className="mr-2" /> Geolocalização (Demanda)
                </button>
                <button
                    onClick={() => setActiveTab('catalog')}
                    className={`px-6 py-3 font-medium text-sm flex items-center transition-colors ${activeTab === 'catalog' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <BarChart2 size={16} className="mr-2" /> Análise de Catálogo
                </button>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        {activeTab === 'trends' ? 'Categoria ou Nicho' : activeTab === 'geo' ? 'Produto Específico' : 'Termo de Busca do Catálogo'}
                    </label>
                    <input
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder={activeTab === 'trends' ? "Ex: Fones de Ouvido Bluetooth" : "Ex: iPhone 15 Pro Max"}
                        value={keyword}
                        onChange={e => setKeyword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    />
                </div>
                <button
                    onClick={handleSearch}
                    disabled={loading || !keyword}
                    className="bg-emerald-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-emerald-700 transition-all shadow-md active:scale-95 disabled:opacity-70 flex items-center justify-center min-w-[150px]"
                >
                    {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : <>Pesquisar <ArrowRight size={18} className="ml-2" /></>}
                </button>
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                {/* TENDÊNCIAS */}
                {activeTab === 'trends' && trendResult && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Visão Geral do Mercado</h3>
                                <p className="text-slate-600 leading-relaxed mb-4">{trendResult.overview}</p>
                                <div className="flex items-center gap-4 text-sm">
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">Oportunidade: {trendResult.opportunityLevel}</span>
                                    <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full">Preço Médio: {trendResult.priceRange}</span>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Produtos em Alta</h3>
                                <ul className="space-y-2">
                                    {trendResult.trendingProducts.map((prod, idx) => (
                                        <li key={idx} className="flex items-start text-sm text-slate-700">
                                            <span className="text-emerald-500 mr-2 font-bold">{idx + 1}.</span> {prod}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* ML */}
                            <div className="bg-yellow-50 p-5 rounded-xl border border-yellow-200">
                                <h4 className="font-bold text-yellow-800 mb-3 flex items-center"><TrendingUp size={16} className="mr-2" /> Mercado Livre</h4>
                                <ul className="text-sm space-y-2 text-slate-700">
                                    {trendResult.marketplaceSpecifics?.mercadoLivre.map((item, i) => (
                                        <li key={i}>• {item}</li>
                                    ))}
                                </ul>
                            </div>
                            {/* Amazon */}
                            <div className="bg-slate-100 p-5 rounded-xl border border-slate-300">
                                <h4 className="font-bold text-slate-800 mb-3 flex items-center"><TrendingUp size={16} className="mr-2" /> Amazon</h4>
                                <ul className="text-sm space-y-2 text-slate-700">
                                    {trendResult.marketplaceSpecifics?.amazon.map((item, i) => (
                                        <li key={i}>• {item}</li>
                                    ))}
                                </ul>
                            </div>
                            {/* Shopee */}
                            <div className="bg-orange-50 p-5 rounded-xl border border-orange-200">
                                <h4 className="font-bold text-orange-800 mb-3 flex items-center"><TrendingUp size={16} className="mr-2" /> Shopee</h4>
                                <ul className="text-sm space-y-2 text-slate-700">
                                    {trendResult.marketplaceSpecifics?.shopee.map((item, i) => (
                                        <li key={i}>• {item}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* GEOLOCALIZAÇÃO */}
                {activeTab === 'geo' && geoResult && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                                    <Globe className="mr-2 text-blue-500" /> Mapa de Calor (Interesse)
                                </h3>
                                <div className="space-y-4">
                                    {geoResult.topRegions.map((region, idx) => (
                                        <div key={idx} className="relative pt-1">
                                            <div className="flex mb-2 items-center justify-between">
                                                <div className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                                                    {region.region}
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs font-semibold inline-block text-blue-600">
                                                        {region.interestLevel}%
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-100">
                                                <div style={{ width: `${region.interestLevel}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-1000"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                    <h3 className="text-lg font-bold text-slate-800 mb-4">Termos de Busca Relacionados</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {geoResult.relatedQueries.map((query, idx) => (
                                            <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-sm border border-slate-200">
                                                {query}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100">
                                    <h3 className="text-lg font-bold text-emerald-800 mb-2">Insight de Sazonalidade</h3>
                                    <p className="text-emerald-700 text-sm italic">
                                        "{geoResult.seasonalInsight}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* CATÁLOGO ML */}
                {activeTab === 'catalog' && catalogResult && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {catalogResult.map((item, idx) => (
                                <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between hover:border-emerald-400 transition-colors group">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded uppercase">Winner</span>
                                            <span className={`text-xs font-bold px-2 py-1 rounded ${item.competitionLevel === 'Alta' || item.competitionLevel === 'Extrema' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                Comp: {item.competitionLevel}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-slate-800 text-sm mb-2 line-clamp-2" title={item.productName}>{item.productName}</h4>
                                        <p className="text-2xl font-bold text-emerald-600 mb-3">{item.winningPrice}</p>

                                        <div className="bg-slate-50 p-3 rounded-lg mb-4">
                                            <p className="text-xs text-slate-500 italic">💡 {item.tipToWin}</p>
                                        </div>
                                    </div>

                                    <a
                                        href={item.productUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full mt-2 bg-slate-800 text-white text-center py-2 rounded-lg text-sm hover:bg-slate-900 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                                    >
                                        Ver no Mercado Livre <Search size={14} className="ml-2" />
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !trendResult && !geoResult && !catalogResult && (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <Search size={48} className="mb-4 opacity-20" />
                        <p>Selecione uma aba e faça uma pesquisa para começar.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MarketRadar;
