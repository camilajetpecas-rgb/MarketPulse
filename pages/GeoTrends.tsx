
import React, { useState } from 'react';
import { analyzeGeoTrends } from '../services/gemini';
import { GeoTrendResult } from '../types';
import { Map, Search, Loader2, MapPin, Hash, Calendar, Lightbulb } from 'lucide-react';

const GeoTrends: React.FC = () => {
  const [product, setProduct] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeoTrendResult | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setLoading(true);
    setResult(null);
    try {
      const data = await analyzeGeoTrends(product);
      setResult(data);
    } catch (error) {
      alert("Erro ao buscar dados geográficos. Tente novamente.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center">
            <Map className="mr-3 text-purple-600" />
            Mapa de Demanda (GeoAnalytics)
        </h1>
        <p className="text-slate-600 mt-2 max-w-2xl">
          Descubra <strong>onde</strong> seus clientes estão e <strong>como</strong> eles pesquisam. Utilize a inteligência de geolocalização para otimizar suas campanhas de Ads e estoque.
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3.5 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Digite o produto (ex: Radiador Corsa, Capa de Banco, Ar Condicionado)"
              className="w-full h-12 pl-10 pr-4 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 outline-none transition text-lg"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !product}
            className="h-12 px-8 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-purple-200"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Mapear Demanda'}
          </button>
        </form>
      </div>

      {loading && (
        <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <Loader2 className="animate-spin text-purple-600 mx-auto mb-4" size={48} />
          <h3 className="text-xl font-medium text-slate-800">Analisando Dados Regionais...</h3>
          <p className="text-slate-500 mt-2">Consultando tendências de busca por estado e cidade.</p>
        </div>
      )}

      {!loading && !result && (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-100">
              <MapPin size={48} className="mx-auto text-slate-200 mb-4" />
              <h3 className="text-lg font-medium text-slate-600">Aguardando Mapeamento</h3>
              <p className="text-slate-400 mt-1 max-w-md mx-auto">Digite um produto acima para ver o mapa de calor da demanda no Brasil.</p>
          </div>
      )}

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Mapa de Calor (Lista) */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-purple-50 p-4 border-b border-purple-100 flex justify-between items-center">
                    <h3 className="font-bold text-purple-900 flex items-center">
                        <MapPin size={18} className="mr-2" />
                        Regiões com Maior Interesse
                    </h3>
                    <span className="text-xs font-medium text-purple-600 bg-white px-2 py-1 rounded border border-purple-200">Top Locations</span>
                </div>
                <div className="p-6 space-y-5">
                    {result.topRegions.map((region, idx) => (
                        <div key={idx}>
                            <div className="flex justify-between items-end mb-1">
                                <span className="font-medium text-slate-700 flex items-center">
                                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-xs flex items-center justify-center mr-2 font-bold">{idx + 1}</span>
                                    {region.region}
                                </span>
                                <span className="text-sm font-bold text-purple-600">{region.interestLevel}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                <div 
                                    className="bg-purple-600 h-2.5 rounded-full transition-all duration-1000 ease-out" 
                                    style={{ width: `${region.interestLevel}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                    {result.topRegions.length === 0 && <p className="text-slate-500 text-center italic">Dados regionais insuficientes para este termo.</p>}
                </div>
            </div>

            <div className="space-y-8">
                {/* Termos Relacionados */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-800 flex items-center mb-4">
                        <Hash size={18} className="mr-2 text-blue-500" />
                        Como as pessoas pesquisam (Termos Relacionados)
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {result.relatedQueries.map((query, idx) => (
                            <span key={idx} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-blue-100 hover:bg-blue-100 transition-colors cursor-default">
                                {query}
                            </span>
                        ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-4 flex items-center">
                        <Lightbulb size={12} className="mr-1" /> Dica: Use estes termos exatos no título e tags do seu anúncio.
                    </p>
                </div>

                {/* Sazonalidade */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-md p-6 text-white">
                    <h3 className="font-bold text-lg mb-3 flex items-center">
                        <Calendar size={20} className="mr-2 text-yellow-400" />
                        Insight de Sazonalidade
                    </h3>
                    <p className="text-slate-300 leading-relaxed text-sm">
                        {result.seasonalInsight}
                    </p>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default GeoTrends;
