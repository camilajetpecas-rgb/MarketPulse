
import React, { useState, useEffect } from 'react';
import { analyzeListing, extractAdDataFromUrl, generateCopywriting, analyzeTrends } from '../services/gemini';
import { AdAnalysisResult, Platform, ExtractedAdData, CopywritingResult, TrendResult } from '../types';
import { CheckCircle, AlertTriangle, Lightbulb, Search, Loader2, Link as LinkIcon, Download, ArrowDown, Package, Ruler, Star, Truck, Store, FileJson, Calculator, PenTool, BarChart3, Clock, Scale, ShoppingBag, DollarSign, Box, Scan, Info, FileText, FileSpreadsheet, ChevronDown, Tag, CheckSquare, ListTodo, ClipboardList, MapPin } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const Analyzer: React.FC = () => {
    // Main State
    const [activeTab, setActiveTab] = useState<'analysis' | 'calculator' | 'copy'>('analysis');
    const [showExportMenu, setShowExportMenu] = useState(false);

    // Data State
    const [platform, setPlatform] = useState<string>(Platform.MERCADO_LIVRE);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [url, setUrl] = useState('');

    // Async State
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);
    const [loadingFetch, setLoadingFetch] = useState(false);
    const [loadingCopy, setLoadingCopy] = useState(false);
    const [loadingMarket, setLoadingMarket] = useState(false);

    // Results State
    const [result, setResult] = useState<AdAnalysisResult | null>(null);
    const [extractedData, setExtractedData] = useState<ExtractedAdData | null>(null);
    const [copyResult, setCopyResult] = useState<CopywritingResult | null>(null);
    const [marketData, setMarketData] = useState<TrendResult | null>(null);

    // Calculator State
    const [costPrice, setCostPrice] = useState<number>(0);
    const [taxRate, setTaxRate] = useState<number>(10); // %
    const [platformFee, setPlatformFee] = useState<number>(16); // %
    const [shippingCost, setShippingCost] = useState<number>(20);

    useEffect(() => {
        if (extractedData) {
            // Try to parse price to number for calculator
            const priceStr = extractedData.price.replace(/[^\d,.]/g, '').replace(',', '.');
            const priceNum = parseFloat(priceStr);
            if (!isNaN(priceNum) && costPrice === 0) {
                // Just a heuristic: assume cost is 50% if not set
                setCostPrice(parseFloat((priceNum * 0.5).toFixed(2)));
            }
        }
    }, [extractedData]);

    // Função para buscar dados de mercado em background
    const fetchMarketContext = async (productTitle: string) => {
        setLoadingMarket(true);
        try {
            // Usa o título para buscar tendências da categoria
            const trends = await analyzeTrends(productTitle);
            setMarketData(trends);
        } catch (e) {
            console.error("Erro ao buscar dados de mercado:", e);
        } finally {
            setLoadingMarket(false);
        }
    };

    const handleFetchFromUrl = async () => {
        if (!url) return;
        setLoadingFetch(true);
        setResult(null);
        setExtractedData(null);
        setCopyResult(null);
        setMarketData(null);
        setActiveTab('analysis');

        try {
            const data = await extractAdDataFromUrl(url);
            setExtractedData(data);

            setTitle(data.title || '');
            setPrice(data.price || '');
            setDescription(data.description || '');
            setPlatform(data.platform || Platform.GENERIC);

            // Auto-set platform fee estimate
            if (data.platform === Platform.MERCADO_LIVRE) setPlatformFee(16);
            if (data.platform === Platform.AMAZON) setPlatformFee(15);
            if (data.platform === Platform.SHOPEE) setPlatformFee(14);

            // Trigger market analysis in background
            if (data.title) {
                fetchMarketContext(data.title);
            }

        } catch (error) {
            alert("Não conseguimos extrair os dados desse link automaticamente. Por favor, preencha manualmente.");
        } finally {
            setLoadingFetch(false);
        }
    };

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !description) return;

        setLoadingAnalysis(true);
        try {
            const analysis = await analyzeListing(title, description, price, platform);
            setResult(analysis);
        } catch (error) {
            alert("Falha ao analisar o anúncio. Verifique sua chave API.");
        } finally {
            setLoadingAnalysis(false);
        }
    };

    const handleGenerateCopy = async () => {
        if (!extractedData) return;
        setLoadingCopy(true);
        try {
            const copy = await generateCopywriting(extractedData);
            setCopyResult(copy);
        } catch (error) {
            alert("Erro ao gerar copy.");
        } finally {
            setLoadingCopy(false);
        }
    };

    const renderValue = (val?: string) => {
        if (!val || val === 'null' || val === 'undefined' || val === 'N/A') {
            return '-';
        }
        return val;
    };

    // --- EXPORT FUNCTIONS ---

    const generatePDF = () => {
        if (!extractedData) return;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        let yPos = 20;

        // Helper to check page break
        const checkPageBreak = (heightNeeded: number) => {
            if (yPos + heightNeeded > 280) {
                doc.addPage();
                yPos = 20;
            }
        };

        // Header
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(0, 0, pageWidth, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text("Relatório MarketPulse", 14, 20);
        doc.setFontSize(10);
        doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, 14, 28);
        doc.text("Inteligência de Mercado & Análise Técnica", 14, 34);

        yPos = 50;

        // Product Info
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(14);
        doc.text("1. Dados do Produto", 14, yPos);
        yPos += 10;

        autoTable(doc, {
            startY: yPos,
            head: [['Campo', 'Informação']],
            body: [
                ['Produto', extractedData.title],
                ['Plataforma', extractedData.platform],
                ['Preço', extractedData.price],
                ['Vendedor', renderValue(extractedData.seller)],
                ['Localização', renderValue(extractedData.itemLocation)],
                ['Avaliação', `${renderValue(extractedData.rating)} (${renderValue(extractedData.reviewsCount)})`],
                ['Estoque', renderValue(extractedData.stock)],
                ['Idade Anúncio', renderValue(extractedData.listingAge)],
                ['Estimativa Vendas', renderValue(extractedData.salesEstimate)]
            ],
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246] },
            styles: { fontSize: 10 }
        });

        // @ts-ignore
        yPos = doc.lastAutoTable.finalY + 15;

        // Logistics Table
        doc.setFontSize(14);
        doc.text("2. Dados Logísticos & Dimensões", 14, yPos);
        yPos += 10;

        const prodDim = extractedData.productDimensions || extractedData.dimensionsDetails;
        const pkgDim = extractedData.packageDimensions || extractedData.dimensionsDetails;

        autoTable(doc, {
            startY: yPos,
            head: [['Tipo', 'Altura', 'Largura', 'Comp.', 'Peso', 'Fonte']],
            body: [
                [
                    'Produto (Físico)',
                    renderValue(prodDim?.height),
                    renderValue(prodDim?.width),
                    renderValue(prodDim?.length),
                    renderValue(extractedData.productDimensions?.weight || extractedData.weight),
                    extractedData.productDimensions?.source === 'estimated' ? 'Estimado' : 'Real'
                ],
                [
                    'Embalagem (Envio)',
                    renderValue(pkgDim?.height),
                    renderValue(pkgDim?.width),
                    renderValue(pkgDim?.length),
                    renderValue(extractedData.packageDimensions?.weight || extractedData.weight),
                    extractedData.packageDimensions?.source === 'estimated' ? 'Estimado' : 'Real'
                ]
            ],
            theme: 'striped',
            headStyles: { fillColor: [245, 158, 11] }, // Amber color for logistics
        });

        // @ts-ignore
        yPos = doc.lastAutoTable.finalY + 15;

        // Market Analysis (Trends)
        if (marketData) {
            checkPageBreak(60);
            doc.setFontSize(14);
            doc.text("3. Contexto de Mercado (Tendências)", 14, yPos);
            yPos += 10;

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Nível de Oportunidade: ${marketData.opportunityLevel}`, 14, yPos);
            doc.text(`Faixa de Preço Média: ${marketData.priceRange}`, 14, yPos + 6);
            yPos += 14;

            doc.setTextColor(30, 41, 59);
            const splitOverview = doc.splitTextToSize(`Resumo: ${marketData.overview}`, pageWidth - 28);
            doc.text(splitOverview, 14, yPos);
            yPos += splitOverview.length * 5 + 5;

            // Trending Products List
            autoTable(doc, {
                startY: yPos,
                head: [['Produtos em Alta na Categoria']],
                body: marketData.trendingProducts.map(p => [p]),
                theme: 'plain',
                styles: { cellPadding: 1, fontSize: 9 }
            });
            // @ts-ignore
            yPos = doc.lastAutoTable.finalY + 15;
        }

        // AI Analysis
        if (result) {
            checkPageBreak(80);
            doc.setFontSize(14);
            doc.setTextColor(30, 41, 59);
            doc.text("4. Análise de Qualidade (IA)", 14, yPos);
            yPos += 10;

            doc.setFontSize(12);
            doc.text(`Score: ${result.score}/100`, 14, yPos);
            yPos += 8;

            doc.setFontSize(10);
            doc.setTextColor(0, 100, 0); // Green
            doc.text("Pontos Fortes:", 14, yPos);
            result.strengths.forEach((s, i) => {
                doc.text(`• ${s}`, 14, yPos + 5 + (i * 5));
            });

            const weaknessOffset = result.strengths.length * 5 + 10;
            doc.setTextColor(180, 0, 0); // Red
            doc.text("Pontos de Melhoria:", 100, yPos);
            result.weaknesses.forEach((w, i) => {
                doc.text(`• ${w}`, 100, yPos + 5 + (i * 5));
            });

            yPos += Math.max(result.strengths.length, result.weaknesses.length) * 5 + 20;

            // Description Recommendation
            doc.setTextColor(30, 41, 59);
            doc.setFontSize(11);
            doc.text("Sugestão de Descrição Otimizada:", 14, yPos);
            yPos += 6;
            doc.setFontSize(9);
            const splitDesc = doc.splitTextToSize(result.descriptionImprovement, pageWidth - 28);
            doc.text(splitDesc, 14, yPos);
            yPos += splitDesc.length * 5 + 15;
        }

        // Copywriting
        if (copyResult) {
            checkPageBreak(100);
            doc.setFontSize(14);
            doc.setTextColor(30, 41, 59);
            doc.text("5. Copywriting & Persuasão", 14, yPos);
            yPos += 10;

            autoTable(doc, {
                startY: yPos,
                head: [['Títulos Otimizados (SEO & Clique)']],
                body: copyResult.optimizedTitles.map(t => [t]),
                theme: 'grid',
            });

            // @ts-ignore
            yPos = doc.lastAutoTable.finalY + 10;

            autoTable(doc, {
                startY: yPos,
                head: [['Bullet Points (Benefícios)']],
                body: copyResult.bulletPoints.map(b => [b]),
                theme: 'grid',
            });
        }

        // 6. Similar Ads
        if (extractedData.similarAds && extractedData.similarAds.length > 0) {
            // @ts-ignore
            yPos = (doc.lastAutoTable ? doc.lastAutoTable.finalY : yPos) + 15;
            checkPageBreak(50);
            doc.setFontSize(14);
            doc.setTextColor(30, 41, 59);
            doc.text("6. Anúncios Semelhantes", 14, yPos);
            yPos += 10;
            autoTable(doc, {
                startY: yPos,
                head: [['Título', 'Preço']],
                body: extractedData.similarAds.map(ad => [ad.title, ad.price]),
                theme: 'striped'
            });
        }

        // 7. Actionable Insights
        if (extractedData.actionableInsights && extractedData.actionableInsights.length > 0) {
            // @ts-ignore
            yPos = (doc.lastAutoTable ? doc.lastAutoTable.finalY : yPos) + 15;
            checkPageBreak(50);
            doc.setFontSize(14);
            doc.setTextColor(30, 41, 59);
            doc.text("7. Ações Sugeridas", 14, yPos);
            yPos += 10;
            doc.setFontSize(10);
            extractedData.actionableInsights.forEach((insight, i) => {
                doc.text(`[ ] ${insight}`, 14, yPos + (i * 6));
            });
        }

        doc.save(`Relatorio_MarketPulse_${new Date().getTime()}.pdf`);
        setShowExportMenu(false);
    };

    const generateExcel = () => {
        if (!extractedData) return;

        const wb = XLSX.utils.book_new();

        // 1. Aba Geral
        const generalData = [
            { Campo: 'Título', Valor: extractedData.title },
            { Campo: 'Preço', Valor: extractedData.price },
            { Campo: 'Plataforma', Valor: extractedData.platform },
            { Campo: 'Vendedor', Valor: renderValue(extractedData.seller) },
            { Campo: 'Localização', Valor: renderValue(extractedData.itemLocation) },
            { Campo: 'Estoque', Valor: renderValue(extractedData.stock) },
            { Campo: 'Avaliação', Valor: extractedData.rating },
            { Campo: 'Idade Anúncio', Valor: extractedData.listingAge },
            { Campo: 'Vendas Est.', Valor: extractedData.salesEstimate },
            { Campo: 'URL', Valor: url },
        ];
        const wsGeneral = XLSX.utils.json_to_sheet(generalData);
        XLSX.utils.book_append_sheet(wb, wsGeneral, "Dados Produto");

        // 2. Aba Logística
        const logisticsData = [
            {
                Tipo: 'Produto (Físico)',
                Altura: renderValue(extractedData.productDimensions?.height),
                Largura: renderValue(extractedData.productDimensions?.width),
                Comprimento: renderValue(extractedData.productDimensions?.length),
                Peso: renderValue(extractedData.productDimensions?.weight || extractedData.weight),
                Fonte: extractedData.productDimensions?.source === 'estimated' ? 'Estimado' : 'Real'
            },
            {
                Tipo: 'Embalagem (Envio)',
                Altura: renderValue(extractedData.packageDimensions?.height),
                Largura: renderValue(extractedData.packageDimensions?.width),
                Comprimento: renderValue(extractedData.packageDimensions?.length),
                Peso: renderValue(extractedData.packageDimensions?.weight || extractedData.weight),
                Fonte: extractedData.packageDimensions?.source === 'estimated' ? 'Estimado' : 'Real'
            }
        ];
        const wsLogistics = XLSX.utils.json_to_sheet(logisticsData);
        XLSX.utils.book_append_sheet(wb, wsLogistics, "Logística");

        // 3. Aba Análise IA
        if (result) {
            const analysisData = [
                { Tipo: 'Score', Conteudo: result.score },
                { Tipo: 'Análise de Preço', Conteudo: result.priceAnalysis },
                { Tipo: 'Melhoria Descrição', Conteudo: result.descriptionImprovement },
                ...result.strengths.map(s => ({ Tipo: 'Ponto Forte', Conteudo: s })),
                ...result.weaknesses.map(w => ({ Tipo: 'Ponto Fraco', Conteudo: w })),
            ];
            const wsAnalysis = XLSX.utils.json_to_sheet(analysisData);
            XLSX.utils.book_append_sheet(wb, wsAnalysis, "Análise IA");
        }

        // 4. Aba Mercado
        if (marketData) {
            const marketSheetData = [
                { Tipo: 'Oportunidade', Valor: marketData.opportunityLevel },
                { Tipo: 'Preço Médio Mercado', Valor: marketData.priceRange },
                { Tipo: 'Resumo', Valor: marketData.overview },
                ...marketData.trendingProducts.map(p => ({ Tipo: 'Produto em Alta', Valor: p }))
            ];
            const wsMarket = XLSX.utils.json_to_sheet(marketSheetData);
            XLSX.utils.book_append_sheet(wb, wsMarket, "Mercado");
        }

        // 5. Aba Copy
        if (copyResult) {
            const copySheetData = [
                { Secao: 'Pitch de Vendas', Texto: copyResult.salesPitch },
                ...copyResult.optimizedTitles.map(t => ({ Secao: 'Título Sugerido', Texto: t })),
                ...copyResult.bulletPoints.map(b => ({ Secao: 'Bullet Point', Texto: b })),
            ];
            const wsCopy = XLSX.utils.json_to_sheet(copySheetData);
            XLSX.utils.book_append_sheet(wb, wsCopy, "Copywriting");
        }

        // 6. Aba Ações e Semelhantes
        const extraData = [
            ...(extractedData.actionableInsights || []).map(a => ({ Categoria: 'Ação Sugerida', Conteudo: a })),
            ...(extractedData.similarAds || []).map(s => ({ Categoria: 'Anúncio Semelhante', Conteudo: `${s.title} (${s.price}) - ${s.url}` }))
        ];
        if (extraData.length > 0) {
            const wsExtra = XLSX.utils.json_to_sheet(extraData);
            XLSX.utils.book_append_sheet(wb, wsExtra, "Ações e Concorrência");
        }

        XLSX.writeFile(wb, `Relatorio_MarketPulse_${new Date().getTime()}.xlsx`);
        setShowExportMenu(false);
    };

    // Calculator Logic
    const getCalculatorResults = () => {
        const salePrice = parseFloat(price.replace(/[^\d,.]/g, '').replace(',', '.')) || 0;
        const taxAmount = salePrice * (taxRate / 100);
        const feeAmount = salePrice * (platformFee / 100);
        const totalCost = costPrice + taxAmount + feeAmount + shippingCost;
        const profit = salePrice - totalCost;
        const margin = salePrice > 0 ? (profit / salePrice) * 100 : 0;

        return { salePrice, taxAmount, feeAmount, totalCost, profit, margin };
    };

    const calc = getCalculatorResults();

    const scoreData = result ? [
        { name: 'Score', value: result.score },
        { name: 'Remaining', value: 100 - result.score },
    ] : [];

    const getScoreColor = (score: number) => {
        if (score >= 80) return '#22c55e';
        if (score >= 50) return '#eab308';
        return '#ef4444';
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Analisador de Anúncios Pro</h1>
                    <p className="text-slate-600 mt-1">
                        Auditoria completa, extração de dados técnicos e ferramentas de lucro.
                    </p>
                </div>

                {extractedData && (
                    <div className="relative">
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg shadow-sm transition-colors font-medium text-sm"
                        >
                            <Download size={16} className="mr-2" />
                            Exportar Relatório
                            <ChevronDown size={14} className="ml-2" />
                        </button>

                        {showExportMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                <button
                                    onClick={generatePDF}
                                    className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center"
                                >
                                    <FileText size={16} className="mr-2 text-red-500" />
                                    Baixar PDF
                                </button>
                                <button
                                    onClick={generateExcel}
                                    className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center border-t border-slate-100"
                                >
                                    <FileSpreadsheet size={16} className="mr-2 text-green-600" />
                                    Baixar Excel
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Input (3 columns) */}
                <div className="lg:col-span-4 space-y-6">

                    {/* URL Import */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6 shadow-sm">
                        <h3 className="text-blue-900 font-semibold mb-3 flex items-center">
                            <LinkIcon size={18} className="mr-2" />
                            Importar URL do Produto
                        </h3>
                        <div className="space-y-3">
                            <input
                                type="url"
                                placeholder="https://..."
                                className="w-full rounded-lg border-blue-200 border p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={handleFetchFromUrl}
                                disabled={loadingFetch || !url}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center text-sm disabled:opacity-70 shadow-sm"
                            >
                                {loadingFetch ? (
                                    <>
                                        <Loader2 className="animate-spin mr-2" size={16} />
                                        Extraindo Dados...
                                    </>
                                ) : (
                                    <>
                                        <Download className="mr-2" size={16} />
                                        Carregar Dados
                                    </>
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-blue-600/70 mt-3 text-center">
                            Suporta Mercado Livre, Amazon, Shopee
                        </p>
                    </div>

                    <div className="flex items-center justify-center text-slate-300">
                        <ArrowDown size={24} />
                    </div>

                    {/* Form */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-slate-800 font-semibold mb-4 border-b pb-2">Dados do Anúncio</h3>
                        <form onSubmit={handleAnalyze} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Plataforma</label>
                                    <select
                                        className="w-full rounded-lg border-slate-300 border p-2 text-sm"
                                        value={platform}
                                        onChange={(e) => setPlatform(e.target.value)}
                                    >
                                        {Object.values(Platform).map((p) => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Preço</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-lg border-slate-300 border p-2 text-sm"
                                        placeholder="R$ 0,00"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Título</label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border-slate-300 border p-2 text-sm"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Descrição</label>
                                <textarea
                                    rows={8}
                                    className="w-full rounded-lg border-slate-300 border p-2 text-sm resize-none"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loadingAnalysis}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-70 mt-2"
                            >
                                {loadingAnalysis ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        <span>Processando...</span>
                                    </>
                                ) : (
                                    <>
                                        <BarChart3 size={18} />
                                        <span>Gerar Análise</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right Column: Results (8 columns) */}
                <div className="lg:col-span-8 flex flex-col h-full">

                    {/* Tabs Navigation */}
                    <div className="flex border-b border-slate-200 mb-6 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('analysis')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center whitespace-nowrap ${activeTab === 'analysis' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            <Search size={16} className="mr-2" /> Análise Técnica
                        </button>
                        <button
                            onClick={() => setActiveTab('calculator')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center whitespace-nowrap ${activeTab === 'calculator' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            <Calculator size={16} className="mr-2" /> Calculadora de Lucro
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('copy');
                                if (!copyResult && extractedData) handleGenerateCopy();
                            }}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center whitespace-nowrap ${activeTab === 'copy' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            <PenTool size={16} className="mr-2" /> Gerador de Copywriting
                        </button>
                    </div>

                    {/* TAB CONTENT: ANALYSIS */}
                    {activeTab === 'analysis' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

                            {/* EXTRACTED DATA CARD (IMPROVED) */}
                            {extractedData ? (
                                <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                                    <div className="bg-slate-50 border-b border-slate-100 p-6">
                                        <div className="flex justify-between items-start gap-4">
                                            <div>
                                                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded uppercase mb-2">
                                                    {extractedData.platform}
                                                </span>
                                                <h2 className="text-xl font-bold text-slate-900 leading-tight">{renderValue(extractedData.title)}</h2>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="text-3xl font-bold text-slate-900">{renderValue(extractedData.price)}</div>
                                                <div className="flex flex-col items-end mt-1">
                                                    {marketData && marketData.priceRange && (
                                                        <div className="w-32 h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1 flex">
                                                            <div
                                                                className="h-full bg-blue-500"
                                                                style={{ width: '60%' }} // Simplified logic for demo
                                                            ></div>
                                                        </div>
                                                    )}
                                                    <span className="text-[10px] text-slate-400 font-medium uppercase mt-1">Competitividade de Preço</span>
                                                </div>
                                                <a href={url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline flex items-center justify-end mt-1">
                                                    Ver no site <LinkIcon size={12} className="ml-1" />
                                                </a>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detailed Grid */}
                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8">
                                        <div className="space-y-1">
                                            <span className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                <Store size={14} className="mr-1.5" /> Vendedor
                                            </span>
                                            <p className="text-slate-800 font-medium">{renderValue(extractedData.seller)}</p>
                                        </div>

                                        <div className="space-y-1">
                                            <span className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                <Star size={14} className="mr-1.5" /> Avaliação
                                            </span>
                                            <div className="flex items-center">
                                                <span className="text-slate-800 font-medium mr-2">{renderValue(extractedData.rating)}</span>
                                                {extractedData.reviewsCount && <span className="text-xs text-slate-500">({extractedData.reviewsCount})</span>}
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <span className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                <Package size={14} className="mr-1.5" /> Estoque
                                            </span>
                                            <p className="text-slate-800 font-medium">{renderValue(extractedData.stock)}</p>
                                        </div>

                                        {/* NEW: Location Field */}
                                        <div className="space-y-1">
                                            <span className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                <MapPin size={14} className="mr-1.5" /> Localização
                                            </span>
                                            <p className="text-slate-800 font-medium">{renderValue(extractedData.itemLocation)}</p>
                                        </div>

                                        {/* DOUBLE DIMENSIONS DISPLAY (Product vs Package) */}
                                        <div className="space-y-3 lg:col-span-3 bg-slate-50 rounded-lg p-4 border border-slate-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                    <Truck size={14} className="mr-1.5" /> Dados Logísticos (ML Exige Separação)
                                                </span>
                                                <div className="flex gap-3 text-[10px] font-medium uppercase">
                                                    <span className="flex items-center text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                                        <CheckCircle size={10} className="mr-1" /> Dados Reais
                                                    </span>
                                                    <span className="flex items-center text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                                                        <Info size={10} className="mr-1" /> Estimado
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Product Dimensions */}
                                                <div className="bg-white p-3 rounded-lg border border-slate-200 relative">
                                                    {extractedData.productDimensions?.source === 'estimated' && (
                                                        <span className="absolute top-2 right-2 w-2 h-2 bg-amber-400 rounded-full" title="Estimado"></span>
                                                    )}
                                                    <div className="flex items-center text-xs font-bold text-blue-600 mb-3 border-b border-slate-100 pb-2">
                                                        <Scan size={14} className="mr-1.5" /> PRODUTO (Item Físico)
                                                    </div>
                                                    <div className="grid grid-cols-4 gap-2 text-center">
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 uppercase block">Alt</span>
                                                            <span className="font-bold text-slate-800 text-sm">
                                                                {renderValue(extractedData.productDimensions?.height || extractedData.dimensionsDetails?.height)}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 uppercase block">Larg</span>
                                                            <span className="font-bold text-slate-800 text-sm">
                                                                {renderValue(extractedData.productDimensions?.width || extractedData.dimensionsDetails?.width)}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 uppercase block">Comp</span>
                                                            <span className="font-bold text-slate-800 text-sm">
                                                                {renderValue(extractedData.productDimensions?.length || extractedData.dimensionsDetails?.length)}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 uppercase block">Peso</span>
                                                            <span className="font-bold text-slate-800 text-sm">
                                                                {renderValue(extractedData.productDimensions?.weight || extractedData.weight)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Package Dimensions */}
                                                <div className="bg-white p-3 rounded-lg border border-slate-200 relative">
                                                    {extractedData.packageDimensions?.source === 'estimated' ? (
                                                        <div className="absolute top-2 right-2 flex items-center text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                                            Estimado
                                                        </div>
                                                    ) : (
                                                        <div className="absolute top-2 right-2 flex items-center text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                                            Real
                                                        </div>
                                                    )}
                                                    <div className="flex items-center text-xs font-bold text-amber-600 mb-3 border-b border-slate-100 pb-2">
                                                        <Box size={14} className="mr-1.5" /> EMBALAGEM (Envio)
                                                    </div>
                                                    <div className="grid grid-cols-4 gap-2 text-center">
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 uppercase block">Alt</span>
                                                            <span className="font-bold text-slate-800 text-sm">
                                                                {renderValue(extractedData.packageDimensions?.height || extractedData.dimensionsDetails?.height)}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 uppercase block">Larg</span>
                                                            <span className="font-bold text-slate-800 text-sm">
                                                                {renderValue(extractedData.packageDimensions?.width || extractedData.dimensionsDetails?.width)}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 uppercase block">Comp</span>
                                                            <span className="font-bold text-slate-800 text-sm">
                                                                {renderValue(extractedData.packageDimensions?.length || extractedData.dimensionsDetails?.length)}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 uppercase block">Peso</span>
                                                            <span className="font-bold text-slate-800 text-sm">
                                                                {renderValue(extractedData.packageDimensions?.weight || extractedData.weight)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-2 text-center">
                                                *Se a embalagem estiver marcada como "Estimado", adicionamos uma margem de segurança padrão sobre o produto.
                                            </p>
                                        </div>

                                        <div className="space-y-1">
                                            <span className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                <Clock size={14} className="mr-1.5" /> Tempo Ativo
                                            </span>
                                            <p className="text-slate-800 font-medium">{renderValue(extractedData.listingAge)}</p>
                                        </div>

                                        <div className="space-y-1 lg:col-span-2">
                                            <span className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                <ShoppingBag size={14} className="mr-1.5" /> Volume de Vendas Estimado
                                            </span>
                                            <p className="text-slate-800 font-medium bg-green-50 text-green-700 inline-block px-2 rounded">
                                                {renderValue(extractedData.salesEstimate)}
                                            </p>
                                        </div>

                                        {/* Similar Ads Section */}
                                        {extractedData.similarAds && extractedData.similarAds.length > 0 && (
                                            <div className="lg:col-span-3 mt-4">
                                                <span className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                                                    <Search size={14} className="mr-1.5" /> Anúncios Semelhantes Encontrados
                                                </span>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {extractedData.similarAds.map((ad, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={ad.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-300 transition-colors group"
                                                        >
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sm font-medium text-slate-700 truncate group-hover:text-blue-600 transition-colors">{ad.title}</p>
                                                                <p className="text-xs text-slate-500 font-bold mt-0.5">{ad.price}</p>
                                                            </div>
                                                            <LinkIcon size={14} className="text-slate-300 group-hover:text-blue-500 ml-3" />
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Actionable Insights Section */}
                                        {extractedData.actionableInsights && extractedData.actionableInsights.length > 0 && (
                                            <div className="lg:col-span-3 mt-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                                <span className="flex items-center text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">
                                                    <CheckSquare size={14} className="mr-1.5" /> Ações Sugeridas (Otimização Imediata)
                                                </span>
                                                <ul className="space-y-2">
                                                    {extractedData.actionableInsights.map((insight, idx) => (
                                                        <li key={idx} className="flex items-start text-sm text-slate-700">
                                                            <div className="mt-1 mr-2 text-blue-500 shrink-0">
                                                                <CheckCircle size={14} />
                                                            </div>
                                                            {insight}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    {/* Market Context Indicator */}
                                    {loadingMarket ? (
                                        <div className="bg-blue-50 px-6 py-2 flex items-center justify-center text-xs text-blue-600">
                                            <Loader2 size={12} className="animate-spin mr-2" />
                                            Buscando dados de mercado para este produto...
                                        </div>
                                    ) : marketData ? (
                                        <div className="bg-green-50 px-6 py-2 flex items-center justify-center text-xs text-green-700 border-t border-green-100">
                                            <CheckCircle size={12} className="mr-2" />
                                            Dados de mercado sincronizados para o relatório.
                                        </div>
                                    ) : null}
                                </div>
                            ) : (
                                <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-12 text-center">
                                    <Package size={48} className="mx-auto text-slate-300 mb-4" />
                                    <h3 className="text-lg font-medium text-slate-600">Nenhum dado importado</h3>
                                    <p className="text-slate-500 text-sm mt-1">Cole um link à esquerda para ver os dados técnicos.</p>
                                </div>
                            )}

                            {/* AI ANALYSIS RESULTS */}
                            {result && (
                                <div className="space-y-6">
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row items-center gap-8">
                                        <div className="relative w-40 h-40 shrink-0">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={scoreData}
                                                        innerRadius={50}
                                                        outerRadius={70}
                                                        startAngle={90}
                                                        endAngle={-270}
                                                        dataKey="value"
                                                    >
                                                        <Cell key="score" fill={getScoreColor(result.score)} />
                                                        <Cell key="bg" fill="#e2e8f0" />
                                                    </Pie>
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-3xl font-bold text-slate-800">{result.score}</span>
                                                <span className="text-xs text-slate-500 uppercase font-semibold">Score</span>
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-2 text-center sm:text-left">
                                            <h3 className="text-xl font-semibold text-slate-800">
                                                {result.score >= 80 ? 'Anúncio Excelente!' : result.score >= 50 ? 'Bom Potencial' : 'Precisa de Atenção'}
                                            </h3>
                                            <p className="text-slate-600 text-sm">{result.priceAnalysis}</p>
                                        </div>
                                    </div>

                                    {/* NEW: Raio-X de Relevância (Tags + Actions) */}
                                    {result.tags && result.actionPlan && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Tags Section */}
                                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                                <h4 className="flex items-center text-slate-800 font-semibold mb-4">
                                                    <Tag size={18} className="mr-2 text-indigo-500" />
                                                    Raio-X de Relevância
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {result.tags.map((tag, idx) => (
                                                        <span
                                                            key={idx}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${tag.type === 'positive'
                                                                ? 'bg-green-50 text-green-700 border-green-200'
                                                                : tag.type === 'negative'
                                                                    ? 'bg-red-50 text-red-700 border-red-200'
                                                                    : 'bg-slate-50 text-slate-600 border-slate-200'
                                                                }`}
                                                        >
                                                            {tag.label}
                                                        </span>
                                                    ))}
                                                </div>
                                                <p className="text-xs text-slate-400 mt-4 italic">
                                                    *Estas tags simulam como o algoritmo classifica seu anúncio internamente.
                                                </p>
                                            </div>

                                            {/* Action Plan Section */}
                                            <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-6">
                                                <h4 className="flex items-center text-indigo-900 font-semibold mb-4">
                                                    <ClipboardList size={18} className="mr-2" />
                                                    Plano de Ação (Prioridade)
                                                </h4>
                                                <ul className="space-y-3">
                                                    {result.actionPlan.map((action, idx) => (
                                                        <li key={idx} className="flex items-start">
                                                            <div className="bg-white p-0.5 rounded mr-3 mt-0.5 shadow-sm">
                                                                <CheckSquare size={14} className="text-indigo-600" />
                                                            </div>
                                                            <span className="text-sm text-indigo-800 font-medium leading-tight">
                                                                {action}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-green-50 rounded-xl border border-green-100 p-5">
                                            <h4 className="flex items-center text-green-800 font-semibold mb-3">
                                                <CheckCircle size={18} className="mr-2" />
                                                Pontos Fortes
                                            </h4>
                                            <ul className="space-y-2">
                                                {result.strengths.map((item, idx) => (
                                                    <li key={idx} className="text-green-700 text-sm flex items-start">
                                                        <span className="mr-2">•</span>
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="bg-red-50 rounded-xl border border-red-100 p-5">
                                            <h4 className="flex items-center text-red-800 font-semibold mb-3">
                                                <AlertTriangle size={18} className="mr-2" />
                                                Pontos de Melhoria
                                            </h4>
                                            <ul className="space-y-2">
                                                {result.weaknesses.map((item, idx) => (
                                                    <li key={idx} className="text-red-700 text-sm flex items-start">
                                                        <span className="mr-2">•</span>
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                        <h4 className="flex items-center text-blue-800 font-semibold mb-4">
                                            <Lightbulb size={20} className="mr-2" />
                                            Recomendação de Descrição
                                        </h4>
                                        <div className="bg-slate-50 p-4 rounded-lg text-slate-700 text-sm leading-relaxed border border-slate-100 whitespace-pre-wrap">
                                            {result.descriptionImprovement}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB CONTENT: CALCULATOR */}
                    {activeTab === 'calculator' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-8">
                                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                                    <Calculator size={24} className="mr-2 text-blue-600" /> Calculadora de Margem Real
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Preço de Venda (R$)</label>
                                            <input
                                                type="number"
                                                className="w-full p-3 border border-slate-300 rounded-lg"
                                                value={calc.salePrice}
                                                disabled
                                            />
                                            <p className="text-xs text-slate-500 mt-1">Extraído do anúncio</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Custo do Produto (R$)</label>
                                            <input
                                                type="number"
                                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={costPrice}
                                                onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Imposto (%)</label>
                                                <input
                                                    type="number"
                                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                    value={taxRate}
                                                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Comissão Mkt (%)</label>
                                                <input
                                                    type="number"
                                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                    value={platformFee}
                                                    onChange={(e) => setPlatformFee(parseFloat(e.target.value) || 0)}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Custo de Frete Fixo (R$)</label>
                                            <input
                                                type="number"
                                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={shippingCost}
                                                onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 flex flex-col justify-center">
                                        <div className="space-y-3 mb-6 border-b border-slate-200 pb-6">
                                            <div className="flex justify-between text-sm text-slate-600">
                                                <span>Custo Produto</span>
                                                <span>- R$ {costPrice.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm text-slate-600">
                                                <span>Impostos ({taxRate}%)</span>
                                                <span>- R$ {calc.taxAmount.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm text-slate-600">
                                                <span>Comissão ({platformFee}%)</span>
                                                <span>- R$ {calc.feeAmount.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm text-slate-600">
                                                <span>Frete</span>
                                                <span>- R$ {shippingCost.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between font-medium text-slate-800 pt-2">
                                                <span>Custo Total</span>
                                                <span>R$ {calc.totalCost.toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <div className="text-center">
                                            <p className="text-sm text-slate-500 mb-1">Lucro Líquido Estimado</p>
                                            <div className={`text-4xl font-bold mb-2 ${calc.profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                R$ {calc.profit.toFixed(2)}
                                            </div>
                                            <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${calc.margin > 20 ? 'bg-green-100 text-green-800' : calc.margin > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                                Margem: {calc.margin.toFixed(1)}%
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB CONTENT: COPYWRITING */}
                    {activeTab === 'copy' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {!extractedData ? (
                                <div className="text-center py-12 text-slate-500">
                                    Primeiro importe um produto via URL para gerar copy.
                                </div>
                            ) : loadingCopy ? (
                                <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-200">
                                    <Loader2 className="animate-spin text-purple-600 mx-auto mb-4" size={48} />
                                    <h3 className="text-lg font-bold">Criando Textos Persuasivos...</h3>
                                    <p className="text-slate-500">A IA está escrevendo títulos e benefícios baseados no produto.</p>
                                </div>
                            ) : copyResult ? (
                                <div className="space-y-6">
                                    <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
                                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                                            <Star className="text-yellow-500 mr-2" /> Títulos de Alta Conversão
                                        </h3>
                                        <div className="space-y-3">
                                            {copyResult.optimizedTitles.map((t, i) => (
                                                <div key={i} className="flex items-center bg-slate-50 p-3 rounded-lg border border-slate-100 hover:border-blue-300 transition-colors cursor-copy group relative" onClick={() => navigator.clipboard.writeText(t)}>
                                                    <span className="font-mono text-slate-400 mr-3 text-sm">{i + 1}</span>
                                                    <span className="font-medium text-slate-800">{t}</span>
                                                    <span className="ml-auto text-xs text-blue-500 opacity-0 group-hover:opacity-100">Copiar</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
                                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                                            <CheckCircle className="text-green-500 mr-2" /> Bullet Points (Benefícios)
                                        </h3>
                                        <ul className="space-y-3">
                                            {copyResult.bulletPoints.map((bp, i) => (
                                                <li key={i} className="flex items-start">
                                                    <span className="mr-2 text-green-500 mt-1">•</span>
                                                    <span className="text-slate-700">{bp}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-md p-6 text-white">
                                        <h3 className="text-lg font-bold mb-3 flex items-center">
                                            <DollarSign className="mr-2" /> Pitch de Vendas
                                        </h3>
                                        <p className="text-blue-50 leading-relaxed italic">
                                            "{copyResult.salesPitch}"
                                        </p>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default Analyzer;
