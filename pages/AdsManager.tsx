import React, { useState } from 'react';
import { Calculator, DollarSign, Target, TrendingUp, AlertTriangle, CheckCircle, BarChart3, HelpCircle } from 'lucide-react';
import { generateAdsAudit } from '../services/gemini';

const AdsManager: React.FC = () => {
    // --- State Calculator ---
    const [adSpend, setAdSpend] = useState('');
    const [revenue, setRevenue] = useState('');
    const [roasResult, setRoasResult] = useState<{ roas: number, acos: number } | null>(null);

    // --- State Simulator ---
    const [productPrice, setProductPrice] = useState('');
    const [targetAcos, setTargetAcos] = useState('');
    const [conversionRate, setConversionRate] = useState('');
    const [maxBid, setMaxBid] = useState<number | null>(null);

    // --- State AI Audit ---
    const [campaignContext, setCampaignContext] = useState('');
    const [auditLoading, setAuditLoading] = useState(false);
    const [auditResult, setAuditResult] = useState<string | null>(null);

    // --- Tab State ---
    const [activeTab, setActiveTab] = useState<'calculator' | 'simulator' | 'audit'>('calculator');

    // Logic: ROAS & ACOS
    const calculateMetrics = () => {
        const cost = parseFloat(adSpend.replace(',', '.'));
        const sales = parseFloat(revenue.replace(',', '.'));

        if (cost && sales) {
            const roas = sales / cost;
            const acos = (cost / sales) * 100;
            setRoasResult({ roas, acos });
        }
    };

    // Logic: Bid Simulator
    const calculateMaxBid = () => {
        // Formula: Max CPC = (Price * Target ACoS%) * Conversion Rate%
        const price = parseFloat(productPrice.replace(',', '.'));
        const acosPercent = parseFloat(targetAcos.replace(',', '.')) / 100;
        const convPercent = parseFloat(conversionRate.replace(',', '.')) / 100;

        if (price && acosPercent && convPercent) {
            const bid = price * acosPercent * convPercent;
            setMaxBid(bid);
        }
    };

    // Logic: AI Audit
    const handleAudit = async () => {
        if (!campaignContext) return;
        setAuditLoading(true);
        try {
            const result = await generateAdsAudit(campaignContext);
            setAuditResult(result);
        } catch (error) {
            alert('Erro ao auditar campanha. Tente novamente.');
        } finally {
            setAuditLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center">
                        <Target className="mr-3 text-purple-600" /> Gestor de Inteligência de ADS
                    </h1>
                    <p className="text-slate-600 mt-1">Simule, Calcule e Audite suas campanhas do Mercado Ads e Amazon Ads.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('calculator')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center whitespace-nowrap ${activeTab === 'calculator' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Calculator size={18} className="mr-2" /> Calculadora ROAS/ACOS
                </button>
                <button
                    onClick={() => setActiveTab('simulator')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center whitespace-nowrap ${activeTab === 'simulator' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <DollarSign size={18} className="mr-2" /> Simulador de Bid (CPC)
                </button>
                <button
                    onClick={() => setActiveTab('audit')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center whitespace-nowrap ${activeTab === 'audit' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <BarChart3 size={18} className="mr-2" /> Auditoria com IA
                </button>
            </div>

            {/* --- CALCULATOR TAB --- */}
            {activeTab === 'calculator' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                            <TrendingUp size={20} className="mr-2 text-blue-500 float-left" />
                            Dados da Campanha
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-500 mb-1">Gasto Total (Ads)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-slate-400">R$</span>
                                    <input
                                        type="number"
                                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                        placeholder="0.00"
                                        value={adSpend}
                                        onChange={e => setAdSpend(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-500 mb-1">Receita Gerada (Vendas)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-slate-400">R$</span>
                                    <input
                                        type="number"
                                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                        placeholder="0.00"
                                        value={revenue}
                                        onChange={e => setRevenue(e.target.value)}
                                    />
                                </div>
                            </div>
                            <button
                                onClick={calculateMetrics}
                                className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition-colors"
                            >
                                Calcular Performance
                            </button>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8 rounded-xl shadow-lg flex flex-col justify-center items-center text-center">
                        {!roasResult ? (
                            <div className="text-slate-400">
                                <HelpCircle size={48} className="mx-auto mb-4 opacity-50" />
                                <p>Preencha os dados ao lado para ver sua performance.</p>
                            </div>
                        ) : (
                            <div className="w-full space-y-8 animate-in zoom-in duration-300">
                                <div>
                                    <p className="text-slate-400 uppercase tracking-wider text-xs font-bold mb-2">Seu ROAS (Retorno)</p>
                                    <div className="text-5xl font-extrabold text-emerald-400">
                                        {roasResult.roas.toFixed(2)}x
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">Para cada R$1 gasto, voltam R${roasResult.roas.toFixed(2)}</p>
                                </div>
                                <div className="w-full h-px bg-slate-700"></div>
                                <div>
                                    <p className="text-slate-400 uppercase tracking-wider text-xs font-bold mb-2">Seu ACOS (Custo de Venda)</p>
                                    <div className={`text-5xl font-extrabold ${roasResult.acos > 30 ? 'text-red-400' : 'text-blue-400'}`}>
                                        {roasResult.acos.toFixed(1)}%
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {roasResult.acos < 15 ? 'Performance Excelente!' : roasResult.acos < 30 ? 'Performance Saudável' : 'Atenção: Margem Comprometida'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- SIMULATOR TAB --- */}
            {activeTab === 'simulator' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                            <Target size={20} className="mr-2 text-purple-500" />
                            Parâmetros de Produto
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-500 mb-1">Preço do Produto</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-slate-400">R$</span>
                                    <input
                                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                        placeholder="100.00"
                                        value={productPrice}
                                        onChange={e => setProductPrice(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-500 mb-1">ACOS Alvo (Quanto aceita pagar?)</label>
                                <div className="relative">
                                    <span className="absolute right-4 top-2.5 text-slate-400">%</span>
                                    <input
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                        placeholder="Ex: 15"
                                        value={targetAcos}
                                        onChange={e => setTargetAcos(e.target.value)}
                                    />
                                </div>
                                <p className="text-xs text-slate-400 mt-1">Geralmente entre 10% a 20% para manter lucro.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-500 mb-1">Taxa de Conversão (Histórico)</label>
                                <div className="relative">
                                    <span className="absolute right-4 top-2.5 text-slate-400">%</span>
                                    <input
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                        placeholder="Ex: 1.5"
                                        value={conversionRate}
                                        onChange={e => setConversionRate(e.target.value)}
                                    />
                                </div>
                                <p className="text-xs text-slate-400 mt-1">Média e-commerce no Brasil: 1% a 2%.</p>
                            </div>
                            <button
                                onClick={calculateMaxBid}
                                className="w-full bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                Calcular Bid Máximo
                            </button>
                        </div>
                    </div>

                    <div className="bg-purple-50 border border-purple-100 p-8 rounded-xl shadow-sm flex flex-col justify-center items-center text-center">
                        {!maxBid ? (
                            <div className="text-purple-400/70">
                                <DollarSign size={48} className="mx-auto mb-4 opacity-50" />
                                <p>Descubra até onde você pode pagar pelo clique (CPC) sem ter prejuízo.</p>
                            </div>
                        ) : (
                            <div className="w-full space-y-6 animate-in zoom-in duration-300">
                                <div>
                                    <p className="text-purple-700 uppercase tracking-wider text-xs font-bold mb-2">LANCE MÁXIMO (CPC) SUGERIDO</p>
                                    <div className="text-6xl font-extrabold text-purple-600">
                                        R$ {maxBid.toFixed(2)}
                                    </div>
                                    <p className="text-sm text-purple-800 mt-3 font-medium bg-purple-100 inline-block px-3 py-1 rounded-full">
                                        Teto de Segurança
                                    </p>
                                </div>
                                <div className="bg-white p-4 rounded-lg text-left text-sm text-slate-600 border border-purple-100 shadow-sm">
                                    <p>
                                        <strong>Interpretação:</strong> Se você pagar mais que <b>R$ {maxBid.toFixed(2)}</b> por clique, e mantiver sua conversão em {conversionRate}%, seu custo de venda (ACOS) vai ultrapassar os {targetAcos}%.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- AUDIT TAB --- */}
            {activeTab === 'audit' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Auditoria Inteligente</h3>
                        <p className="text-sm text-slate-600 mb-4">
                            Cole aqui um resumo dos seus resultados (texto ou dados copiados) e a IA vai encontrar falhas.
                        </p>
                        <textarea
                            className="w-full h-48 p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none mb-4"
                            placeholder="Ex: Campanha 'Tênis Running', gastei 500, vendi 1200. CPC médio 2.50. Conversão 0.8%. O que fazer?"
                            value={campaignContext}
                            onChange={e => setCampaignContext(e.target.value)}
                        />
                        <button
                            onClick={handleAudit}
                            disabled={!campaignContext || auditLoading}
                            className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-70 flex justify-center items-center"
                        >
                            {auditLoading ? 'Analisando...' : 'Auditar com IA'}
                        </button>
                    </div>

                    <div className="lg:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-6 min-h-[300px]">
                        {!auditResult ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <BarChart3 size={48} className="mb-4 opacity-50" />
                                <p>Os insights da auditoria aparecerão aqui.</p>
                            </div>
                        ) : (
                            <div className="prose prose-slate max-w-none">
                                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                                    <CheckCircle className="text-green-500 mr-2" /> Relatório de Otimização
                                </h3>
                                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm text-slate-700 whitespace-pre-wrap">
                                    {auditResult}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdsManager;
