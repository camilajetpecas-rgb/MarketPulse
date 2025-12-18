import React, { useState } from 'react';
import { Sparkles, ShoppingBag, Copy, Info, Package } from 'lucide-react';
import { generateFullListing } from '../services/gemini';

const ListingWizard: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [productName, setProductName] = useState('');
    const [characteristics, setCharacteristics] = useState('');
    const [category, setCategory] = useState('');
    const [result, setResult] = useState<any | null>(null);

    const handleGenerate = async () => {
        if (!productName) return;
        setLoading(true);
        try {
            const data = await generateFullListing(productName, characteristics, category);
            setResult(data);
        } catch (error) {
            console.error(error);
            setLoading(false);
            alert("Erro ao gerar anúncio.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 flex items-center">
                    <Sparkles className="mr-3 text-amber-500" /> Criador Mágico de Anúncios
                </h1>
                <p className="text-slate-600 mt-1">
                    Crie títulos, descrições e fichas técnicas completas para Mercado Livre, Amazon e Shopee em segundos.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Input Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">O que vamos vender?</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome simples do produto *</label>
                                <input
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                                    placeholder="Ex: Tênis de Corrida Nike"
                                    value={productName}
                                    onChange={e => setProductName(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Categoria (Opcional)</label>
                                <input
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                                    placeholder="Ex: Calçados esportivos"
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Características principais</label>
                                <textarea
                                    className="w-full h-32 p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                                    placeholder="Ex: Cor preta, tamanho 40, amortecimento gel, ideal para maratona. Bateria dura 20h (se for eletrônico)."
                                    value={characteristics}
                                    onChange={e => setCharacteristics(e.target.value)}
                                />
                                <p className="text-xs text-slate-500 mt-2">Dica: Quanto mais detalhes técnicos, melhor a ficha técnica gerada.</p>
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={loading || !productName}
                                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold py-3 rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all shadow-md transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
                            >
                                {loading ? (
                                    <>
                                        <Sparkles className="animate-spin mr-2" size={18} /> Criando Mágica...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2" size={18} /> Gerar Anúncio Completo
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results Panel */}
                <div className="lg:col-span-2 space-y-6">
                    {!result ? (
                        <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl h-full min-h-[500px] flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                            <Sparkles size={64} className="mb-4 opacity-20" />
                            <h3 className="text-lg font-medium text-slate-500">Seu anúncio aparecerá aqui</h3>
                            <p className="text-sm max-w-md mt-2">A inteligência artificial vai criar 3 opções de título, uma descrição persuasiva (Copywriting) e prever a ficha técnica (Peso, Medidas, Voltagem).</p>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Títulos */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center">
                                    <ShoppingBag size={16} className="mr-2" /> Títulos Otimizados (SEO)
                                </h3>
                                <div className="space-y-3">
                                    {result.titles.map((title: string, index: number) => (
                                        <div key={index} className="group relative bg-slate-50 p-3 rounded-lg border border-slate-200 hover:border-amber-400 transition-colors">
                                            <p className="text-slate-800 font-medium pr-8">{title}</p>
                                            <span className="absolute top-2 right-2 text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">{title.length} chars</span>
                                            <button className="absolute bottom-2 right-2 text-slate-400 hover:text-amber-600" title="Copiar">
                                                <Copy size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Descrição e Copy */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center">
                                    <Info size={16} className="mr-2" /> Descrição Persuasiva
                                </h3>
                                <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap">
                                    {result.description}
                                </div>
                            </div>

                            {/* Ficha Técnica */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center">
                                    <Package size={16} className="mr-2" /> Ficha Técnica Sugerida
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {Object.entries(result.specs).map(([key, value]) => (
                                        <div key={key} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                            <p className="text-xs text-slate-400 uppercase mb-1">{key}</p>
                                            <p className="text-sm font-bold text-slate-800 truncate" title={String(value)}>{String(value)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ListingWizard;
