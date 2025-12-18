
import { GoogleGenAI, Type } from "@google/genai";
import { AdAnalysisResult, TrendResult, ExtractedAdData, Platform, CopywritingResult, CatalogItem, TitleBenchmarkResult, GeoTrendResult } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

// System instruction for the analyst persona
const ANALYST_INSTRUCTION = `Você é o ALGORITMO DE RANQUEAMENTO dos maiores marketplaces (Mercado Livre, Amazon, Shopee).
Sua função é fazer um Raio-X técnico do anúncio.
Você não é apenas um consultor, você é o sistema que decide quem aparece na primeira página.
Analise friamente Título, Preço, Descrição e SEO.`;

export const analyzeListing = async (
    title: string,
    description: string,
    price: string,
    platform: string
): Promise<AdAnalysisResult> => {
    try {
        const prompt = `Faça o Raio-X de Algoritmo deste anúncio do ${platform}.
    Título: ${title}
    Preço: ${price}
    Descrição: ${description}
    
    1. Score: 0 a 100.
    2. Tags de Relevância (Obrigatório): Crie 4 a 6 "Etiquetas de Sistema" curtas que resumam a saúde do anúncio.
       - Use tags Positivas para o que ajuda no ranqueamento (ex: "Título SEO Otimizado", "Palavras-chave Fortes", "Elegível Catálogo").
       - Use tags Negativas para o que derruba o alcance (ex: "Título Curto Demais", "Spam de Keywords", "Descrição Pobre", "Preço Acima da Média").
    3. Plano de Ação: Uma lista de 3 a 5 tarefas práticas e imperativas para o vendedor executar AGORA (ex: "Adicionar ficha técnica completa", "Incluir vídeo no anúncio").
    4. Análise padrão: Pontos fortes, fracos, keywords SEO, melhoria de descrição e análise de preço.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: ANALYST_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.INTEGER, description: "Score from 0 to 100" },
                        tags: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    label: { type: Type.STRING, description: "Nome da tag ex: Título Otimizado" },
                                    type: { type: Type.STRING, enum: ["positive", "negative", "neutral"] }
                                }
                            },
                            description: "Tags técnicas de algoritmo"
                        },
                        actionPlan: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Lista de tarefas práticas" },
                        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                        weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                        seoKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                        descriptionImprovement: { type: Type.STRING },
                        priceAnalysis: { type: Type.STRING },
                    },
                    required: ["score", "tags", "actionPlan", "strengths", "weaknesses", "seoKeywords", "descriptionImprovement", "priceAnalysis"],
                },
            },
        });

        if (response.text) {
            return JSON.parse(response.text) as AdAnalysisResult;
        }
        throw new Error("Resposta vazia da IA");
    } catch (error) {
        console.error("Erro na análise:", error);
        throw error;
    }
};

export const extractAdDataFromUrl = async (url: string): Promise<ExtractedAdData> => {
    try {
        // PASSO 1: Busca Focada em Logística, Ficha Técnica e LOCALIZAÇÃO
        // Adicionamos queries de busca específicas para forçar o retorno de metadados técnicos

        // Tenta extrair palavras-chave da URL para ajudar na busca (Ex: .../aditivo-radiador... -> "aditivo radiador")
        let urlKeywords = "";
        try {
            const urlObj = new URL(url);
            const pathSegments = urlObj.pathname.split('/');
            // Pega o segmento mais longo que geralmente é o nome do produto
            const productSlug = pathSegments.sort((a, b) => b.length - a.length)[0];
            if (productSlug) {
                urlKeywords = productSlug.replace(/-/g, ' ').replace(/_/g, ' ');
            }
        } catch (e) {
            console.log("Erro ao parsear URL para keywords", e);
        }

        const searchPrompt = `Você é um AUDITOR DE LOGÍSTICA DE E-COMMERCE. 
    Preciso extrair os dados técnicos deste produto.
    
    URL DO PRODUTO: ${url}
    TERMOS DO PRODUTO (EXTRAÍDOS DA URL): ${urlKeywords}
    
    ALVO PRINCIPAL: DIMENSÕES, PESO E LOCALIZAÇÃO DO ESTOQUE.
    
    Execute buscas para encontrar:
    1. O produto exato "${urlKeywords}" no Mercado Livre/Amazon/Shopee e suas "Características Principais" ou "Ficha Técnica".
    2. Procure padrões numéricos de medidas no texto: "20x30x10", "20cm", "kg", "gramas".
    3. Identifique a LOCALIZAÇÃO DO VENDEDOR ou de onde o produto é enviado (Cidade/Estado). Procure por termos como "Enviado de", "Localização", "Vendido por... de...".
    4. Se não achar no site original, procure produtos idênticos em outros sites para estimar as medidas.
    
    Retorne um resumo contendo:
    - Título, Preço, Vendedor.
    - LOCALIZAÇÃO DO ESTOQUE (Cidade, UF).
    - DESCRIÇÃO DETALHADA DAS MEDIDAS ENCONTRADAS (Altura, Largura, Profundidade, Peso).
    - Se é medida do produto ou da embalagem.
    `;

        // Executa busca pela URL
        const urlSearchPromise = ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: searchPrompt,
            config: { tools: [{ googleSearch: {} }] }
        });

        // Executa busca pelo NOME DO PRODUTO (Keywords) em paralelo (Backup Garantido)
        let keywordSearchPromise: Promise<any> | null = null;
        if (urlKeywords) {
            console.log("Iniciando busca paralela por keywords:", urlKeywords);
            const keywordPrompt = `Pesquise especificamente por: Ficha Técnica, Dimensões e Preço de "${urlKeywords}".
            Preciso das medidas (altura, largura, comprimento) e peso do produto/embalagem.`;

            keywordSearchPromise = ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: keywordPrompt,
                config: { tools: [{ googleSearch: {} }] }
            });
        }

        const [urlResponse, keywordResponse] = await Promise.all([
            urlSearchPromise,
            keywordSearchPromise ? keywordSearchPromise : Promise.resolve(null)
        ]);

        const urlText = urlResponse.text || "";
        const keywordText = keywordResponse ? keywordResponse.text : "";

        // Combina os contextos para o LLM processar
        const searchResultText = `
        --- DADOS DA URL ESPECÍFICA ---
        ${urlText}
        
        --- DADOS GERAIS DO PRODUTO (BUSCA POR NOME) ---
        ${keywordText || "Nenhuma informação adicional encontrada."}
        `;

        if (!urlText && !keywordText) {
            throw new Error("A busca não retornou dados textuais suficientes em nenhuma das tentativas.");
        }

        // PASSO 2: Conversão Inteligente com Estimativa Obrigatória
        const formatPrompt = `Analise os dados brutos abaixo e preencha o JSON de logística.
    
    Dados brutos da pesquisa:
    ${searchResultText}
    
    REGRAS DE OURO PARA DIMENSÕES (NUNCA DEIXE VAZIO):
    1. **Extração**: Se houver medidas "A x L x P" ou similares, preencha 'productDimensions'.
    2. **Cálculo de Embalagem**: Se você tiver as medidas do produto, MAS NÃO as da embalagem, CALCULE a embalagem:
       - Altura: +2cm a +5cm
       - Largura: +2cm a +5cm
       - Comprimento: +2cm a +5cm
       - Peso: +10% a +20%
       - Marque source='estimated'.
    3. **Estimativa de Último Recurso**: Se não houver NENHUMA medida no texto, ESTIME com base no tipo de produto (ex: se for 'Celular', use 15x8x5cm, 0.4kg). NÃO RETORNE NULL. Use seu conhecimento de mundo.
    4. **Localização**: Extraia a cidade e estado do vendedor/estoque. Se não encontrar, deixe vazio. Formato ideal: "Cidade, UF".
    
    Schema desejado: JSON estrito.
    
    NOTA: Se a busca foi genérica (pelo nome do produto), preencha 'seller' como 'Vários Vendedores' e 'itemLocation' como 'Brasil'.`;

        const jsonResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: formatPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        price: { type: Type.STRING },
                        description: { type: Type.STRING },
                        platform: { type: Type.STRING },
                        seller: { type: Type.STRING },
                        stock: { type: Type.STRING },
                        rating: { type: Type.STRING },
                        reviewsCount: { type: Type.STRING },
                        itemLocation: { type: Type.STRING, description: "Cidade e Estado do estoque ex: São Paulo, SP" },

                        productDimensions: {
                            type: Type.OBJECT,
                            properties: {
                                height: { type: Type.STRING, description: "Altura cm" },
                                width: { type: Type.STRING, description: "Largura cm" },
                                length: { type: Type.STRING, description: "Comp cm" },
                                weight: { type: Type.STRING, description: "Peso kg" },
                                source: { type: Type.STRING, enum: ["extracted", "estimated"] }
                            }
                        },
                        packageDimensions: {
                            type: Type.OBJECT,
                            properties: {
                                height: { type: Type.STRING, description: "Altura cm" },
                                width: { type: Type.STRING, description: "Largura cm" },
                                length: { type: Type.STRING, description: "Comp cm" },
                                weight: { type: Type.STRING, description: "Peso kg" },
                                source: { type: Type.STRING, enum: ["extracted", "estimated"] }
                            }
                        },

                        logistics: { type: Type.STRING },
                        listingAge: { type: Type.STRING },
                        salesEstimate: { type: Type.STRING }
                    },
                    required: ["title", "description"]
                }
            }
        });

        if (jsonResponse.text) {
            const parsed = JSON.parse(jsonResponse.text);

            let cleanPlatform = Platform.GENERIC;
            if (parsed.platform) {
                const p = parsed.platform.toLowerCase();
                if (p.includes('mercado') || p.includes('libre')) cleanPlatform = Platform.MERCADO_LIVRE;
                else if (p.includes('amazon')) cleanPlatform = Platform.AMAZON;
                else if (p.includes('shopee')) cleanPlatform = Platform.SHOPEE;
            }

            // Normalização final para garantir que a UI não quebre
            const dimensionsDetails = parsed.productDimensions ? {
                height: parsed.productDimensions.height,
                width: parsed.productDimensions.width,
                length: parsed.productDimensions.length
            } : undefined;

            const weight = parsed.productDimensions?.weight || parsed.packageDimensions?.weight;

            return {
                ...parsed,
                platform: cleanPlatform,
                dimensionsDetails,
                weight
            } as ExtractedAdData;
        }
        throw new Error("Não foi possível processar os dados encontrados.");

    } catch (error) {
        console.error("Erro na extração de URL:", error);
        throw error;
    }
};

export const generateCopywriting = async (data: ExtractedAdData): Promise<CopywritingResult> => {
    const prompt = `Atue como um Copywriter Expert em Conversão.
    Com base nos dados abaixo, crie materiais de venda persuasivos.
    
    Produto: ${data.title}
    Características: ${data.description}
    Plataforma: ${data.platform}
    
    Gere:
    1. 3 variações de Títulos Altamente Otimizados para SEO e Clique (max 60 chars).
    2. 5 Bullet Points matadores focados em benefícios (não apenas características).
    3. Um parágrafo curto de "Sales Pitch" (argumento de venda) emocionante.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    optimizedTitles: { type: Type.ARRAY, items: { type: Type.STRING } },
                    bulletPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                    salesPitch: { type: Type.STRING }
                }
            }
        }
    });

    if (response.text) {
        return JSON.parse(response.text) as CopywritingResult;
    }
    throw new Error("Falha ao gerar copy.");
}

export const analyzeTrends = async (category: string): Promise<TrendResult> => {
    try {
        const prompt = `Pesquise no Google sobre as tendências atuais de mercado no Brasil para a categoria: "${category}".
    
    Realize pesquisas específicas para descobrir:
    1. Quais são os Top 5 produtos mais vendidos no MERCADO LIVRE nesta categoria.
    2. Quais são os Top 5 produtos "Best Sellers" na AMAZON BRASIL nesta categoria.
    3. Quais são os Top 5 produtos populares na SHOPEE nesta categoria.
    
    Retorne uma análise contendo:
    - Um resumo do cenário atual.
    - Uma lista geral de produtos em alta.
    - Faixa de preço média.
    - Nível de oportunidade.
    - LISTAS ESPECÍFICAS POR MARKETPLACE (Mercado Livre, Amazon, Shopee).
    
    Importante: Utilize a ferramenta de busca para obter dados recentes.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const text = response.text || "";
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
            ?.map((chunk: any) => ({
                title: chunk.web?.title || "Fonte Web",
                uri: chunk.web?.uri || "#"
            }))
            .filter((s: any) => s.uri !== "#") || [];

        const formattingResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Converta a seguinte análise de mercado em JSON estrito.
        Texto da análise: ${text}
        
        Schema desejado:
        {
          "overview": "string",
          "trendingProducts": ["string (lista geral)"],
          "priceRange": "string",
          "opportunityLevel": "Baixa" | "Média" | "Alta",
          "marketplaceSpecifics": {
             "mercadoLivre": ["string (top 5 ML)"],
             "amazon": ["string (top 5 Amazon)"],
             "shopee": ["string (top 5 Shopee)"]
          }
        }`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        overview: { type: Type.STRING },
                        trendingProducts: { type: Type.ARRAY, items: { type: Type.STRING } },
                        priceRange: { type: Type.STRING },
                        opportunityLevel: { type: Type.STRING, enum: ["Baixa", "Média", "Alta"] },
                        marketplaceSpecifics: {
                            type: Type.OBJECT,
                            properties: {
                                mercadoLivre: { type: Type.ARRAY, items: { type: Type.STRING } },
                                amazon: { type: Type.ARRAY, items: { type: Type.STRING } },
                                shopee: { type: Type.ARRAY, items: { type: Type.STRING } }
                            }
                        }
                    }
                }
            }
        });

        const structuredData = JSON.parse(formattingResponse.text || "{}");

        return {
            ...structuredData,
            sources
        };

    } catch (error) {
        console.error("Erro na busca de tendências:", error);
        throw error;
    }
};

export const searchMercadoLivreCatalog = async (category: string): Promise<CatalogItem[]> => {
    try {
        const prompt = `Pesquise no Google especificamente por "Mercado Livre Catálogo ${category}" e "Mais Vendidos Mercado Livre ${category}".
        
        CRITÉRIO DE SELEÇÃO DE VENCEDORES (WINNERS):
        Identifique produtos que sejam LÍDERES DE VENDAS e tenham BUY BOX.
        Ignore produtos com poucas avaliações ou sem relevância.
        Busque por termos como: "#1 Mais vendido", "Amazon Choice", "Destaque", "Full".

        OBJETIVO DE QUANTIDADE: Tente encontrar e listar entre 8 a 12 produtos distintos. Não retorne apenas 3 ou 4. Quero uma visão ampla da categoria. Se a busca inicial trouxer poucos, tente variar os termos para encontrar mais opções do catálogo.

        Para cada produto, identifique:
        1. Nome exato do produto.
        2. Preço médio para ganhar o destaque (Winner Price).
        3. Nível de competição estimado.
        4. Uma dica estratégica para ganhar a Buy Box (ex: "Focar no Full", "Preço abaixo de X").
        5. A URL EXATA do anúncio (Página de Produto - PDP).
           - Tente extrair a URL limpa: "produto.mercadolivre.com.br/MLB-..." ou "mercadolivre.com.br/p/" ou "mercadolivre.com.br/.../up/".
           - **EVITE AO MÁXIMO** links de redirecionamento "google.com/url". Tente pegar a URL de destino.
           - **PROIBIDO** links de listas de busca ("lista.mercadolivre...").

        Use o Google Search para encontrar dados reais recentes.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }]
            }
        });

        const text = response.text || "";

        const formatPrompt = `Converta a lista de produtos de catálogo encontrada em JSON.
        Dados: ${text}
        
        Schema:
        Array de objetos: {
           productName: string,
           winningPrice: string,
           competitionLevel: "Baixa" | "Média" | "Alta" | "Extrema",
           tipToWin: string,
           productUrl: string (URL direta do produto)
        }`;

        const jsonResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: formatPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            productName: { type: Type.STRING },
                            winningPrice: { type: Type.STRING },
                            competitionLevel: { type: Type.STRING, enum: ["Baixa", "Média", "Alta", "Extrema"] },
                            tipToWin: { type: Type.STRING },
                            productUrl: { type: Type.STRING }
                        }
                    }
                }
            }
        });

        return JSON.parse(jsonResponse.text || "[]") as CatalogItem[];

    } catch (error) {
        console.error("Erro ao buscar catálogo:", error);
        throw error;
    }
}

export const generateTitleBenchmarks = async (platform: string, keyword: string): Promise<TitleBenchmarkResult> => {
    try {
        const prompt = `Realize uma pesquisa COMPLETA para encontrar os PRODUTOS MAIS VENDIDOS (Best Sellers) para o termo "${keyword}".
        
        Sua missão é fazer um benchmarking comparativo entre:
        1. Mercado Livre
        2. Amazon Brasil
        3. Shopee
        
        CRITÉRIO DE SELEÇÃO RIGOROSO (FILTRO DE ALTA PERFORMANCE):
        1. PRIORIZE ESTRITAMENTE anúncios que tenham indicações claras de VENDAS ALTAS nos snippets (Ex: "+1000 vendidos", "5 mil vendidos", "#1 Mais Vendido", "Amazon Choice").
        2. PRIORIZE anúncios de VENDEDORES FORTES (Lojas Oficiais, MercadoLíder Platinum, Melhores do Site, Indicado pela Shopee).
        3. IGNORE anúncios patrocinados recentes com poucas vendas. Queremos os campeões orgânicos de rankeamento.

        Para cada plataforma, selecione os 3 a 5 MELHORES anúncios que atendam a esses critérios.
        
        IMPORTANTE SOBRE LINKS (URLs):
        - Você DEVE extrair a URL direta da PÁGINA DO PRODUTO (PDP).
        - O link DEVE começar com "https://".
        - O link DEVE levar diretamente ao produto.
        - **IMPORTANTE:** No Mercado Livre, priorize URLs que contenham "/p/" ou "/up/" ou "/MLB-". Estas são as páginas de produto ou catálogo.
        - **EVITE** links de "google.com/url?q=...". Tente pegar o link real que vem depois do "q=".
        - **PROIBIDO RETORNAR LINKS DE LISTA DE BUSCA** (ex: "lista.mercadolivre.com.br", "/s?k=", "search?keyword="). Retorne apenas a URL do item específico.
        
        IMPORTANTE SOBRE VENDEDOR E LOCALIZAÇÃO (Seja um detetive):
        - Tente identificar o NOME DA LOJA no título ou snippet (Ex: "Loja Oficial", "AutoPeças XYZ").
        - Se não encontrar nome, procure por marcas como "Loja Oficial Samsung", "Importado Prime".
        - Tente identificar a LOCALIZAÇÃO (Cidade/UF) ou origem logística (Ex: "Enviado de SP", "Full").
        - Se o produto for "Full" no Mercado Livre, pode inferir "Estoque Full" na localização se não houver cidade.
        - Se não encontrar nada, use "N/A".
        
        Retorne também uma análise de padrões e sugestões.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }]
            }
        });

        const text = response.text || "";

        const formatPrompt = `Converta a análise de títulos em JSON estrito.
        Texto da análise: ${text}
        
        Schema:
        {
          "competitorTitles": [{ 
              "title": "string", 
              "url": "string (URL absoluta https://... preferencialmente SEM redirecionamento google)", 
              "platform": "string (Mercado Livre | Amazon | Shopee)",
              "sellerName": "string (Se não achar, coloque 'Vendedor Verificado' ou nome da marca)",
              "itemLocation": "string (Se não achar, coloque 'Brasil' ou 'Envio Nacional')"
          }],
          "patternAnalysis": "string (resumo curto do padrão)",
          "suggestedTitles": ["string (sugestões otimizadas)"],
          "highVolumeKeywords": ["string (palavras chaves)"]
        }`;

        const jsonResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: formatPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        competitorTitles: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    url: { type: Type.STRING },
                                    platform: { type: Type.STRING },
                                    sellerName: { type: Type.STRING },
                                    itemLocation: { type: Type.STRING }
                                }
                            }
                        },
                        patternAnalysis: { type: Type.STRING },
                        suggestedTitles: { type: Type.ARRAY, items: { type: Type.STRING } },
                        highVolumeKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        });

        return JSON.parse(jsonResponse.text || "{}") as TitleBenchmarkResult;

    } catch (error) {
        console.error("Erro ao gerar títulos (usando fallback):", error);
        // Fallback para não quebrar a UI
        return {
            competitorTitles: [],
            patternAnalysis: "Não foi possível analisar os padrões no momento devido a uma instabilidade na conexão com os marketplaces. Tente novamente em alguns segundos.",
            suggestedTitles: [
                `${keyword} Promoção`,
                `Oferta ${keyword}`,
                `Melhor preço ${keyword}`
            ],
            highVolumeKeywords: [keyword, "oferta", "original", "novo"]
        };
    }
}

export const generateAdsAudit = async (context: string): Promise<string> => {
    try {
        const prompt = `Você é um ESPECIALISTA SÊNIOR EM TRÁFEGO PAGO (Mercado Ads, Amazon Ads, Google Ads).
        
        Analise os dados brutos da campanha abaixo e forneça uma auditoria estratégica RÁPIDA E DIRETA.
        
        DADOS DA CAMPANHA:
        "${context}"
        
        Responda neste formato estrito:
        1. 🚦 **Diagnóstico**: (Status em 1 frase: Crítico, Atenção ou Saudável)
        2. 💰 **Análise Financeira**: Comente sobre o ROI/ROAS implícito. Estão queimando dinheiro?
        3. 🎯 **Ação Imediata 1**: O que fazer HOJE? (Ex: Pausar, Aumentar Bid, Negativar palavra).
        4. 📈 **Ação Imediata 2**: Próximo passo.
        5. 💡 **Insight Extra**: Uma dica de ouro sobre conversão ou qualidade do anúncio baseada nos números.
        
        Seja curto, grosso e focado em LUCRO.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        return response.text || "Não foi possível gerar a auditoria. Tente detalhar mais os dados.";
    } catch (error) {
        console.error("Erro na auditoria de ADS:", error);
        throw error;
    }
}

export const analyzeGeoTrends = async (product: string): Promise<GeoTrendResult> => {
    try {
        const prompt = `Realize uma pesquisa de DEMANDA DE MERCADO GEOGRÁFICA para o produto: "${product}".

            Objetivo: Identificar ONDE(Regiões / Cidades) e COMO(Termos) os brasileiros buscam este produto.
        
        1. ** Geolocalização e Interesse **:
        - Pesquise por "vendas de ${product} por estado brasil", "onde comprar ${product} cidade".
           - Tente inferir quais regiões têm maior demanda(ex: produtos automotivos em SP / MG / SUL, produtos de praia no NE).
           - Liste 5 regiões(Estados ou Cidades) com um nível de interesse estimado(0 - 100).
        
        2. ** Termos Relacionados **:
        - O que o usuário digita ? Ex : "preço", "melhor marca", "promoção".
        
        3. ** Sazonalidade **:
        - Quando vende mais ? (Verão, Inverno, Dia das Mães, etc).
        
        Seja direto.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }]
            }
        });

        // Limitamos o texto de entrada para evitar tokens excessivos que quebram o JSON
        const text = (response.text || "").substring(0, 20000);

        const formatPrompt = `Converta a análise geográfica em JSON estrito.
            Dados: ${text}

        REGRAS:
        1. Limite 'relatedQueries' a no máximo 10 itens.
        2. Limite 'seasonalInsight' a um parágrafo curto.
        3. Se os dados forem vagos, faça uma estimativa lógica baseada em grandes centros(SP, RJ, MG).

            Schema:
        {
            "topRegions": [{ "region": "string (Estado/Cidade)", "interestLevel": number(0 - 100) }],
                "relatedQueries": ["string (termos de busca)"],
                    "seasonalInsight": "string (resumo sobre quando vende mais)"
        } `;

        const jsonResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: formatPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        topRegions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: { region: { type: Type.STRING }, interestLevel: { type: Type.NUMBER } }
                            }
                        },
                        relatedQueries: { type: Type.ARRAY, items: { type: Type.STRING } },
                        seasonalInsight: { type: Type.STRING }
                    }
                }
            }
        });

        // Parse seguro
        try {
            if (!jsonResponse.text) throw new Error("Empty response");
            return JSON.parse(jsonResponse.text) as GeoTrendResult;
        } catch (e) {
            console.warn("Falha no parse JSON GeoTrends, usando fallback.");
            throw e;
        }

    } catch (error) {
        console.error("Erro na análise geográfica:", error);
        // Fallback silencioso para garantir que a tela carregue algo útil
        return {
            topRegions: [
                { region: "São Paulo", interestLevel: 100 },
                { region: "Minas Gerais", interestLevel: 85 },
                { region: "Rio de Janeiro", interestLevel: 75 },
                { region: "Paraná", interestLevel: 65 },
                { region: "Rio Grande do Sul", interestLevel: 55 }
            ],
            relatedQueries: [
                `${product} preço`,
                `melhor ${product} `,
                `oferta ${product} `,
                `loja ${product} `,
                `${product} mercado livre`
            ],
            seasonalInsight: "A demanda segue a densidade populacional e frota de veículos (no caso de peças). Dados estimados devido a instabilidade momentânea na coleta em tempo real."
        };
    }
}

export interface MagicListingResult {
    titles: string[];
    description: string;
    specs: Record<string, string>;
}

export const generateFullListing = async (productName: string, characteristics: string, category: string): Promise<MagicListingResult> => {
    try {
        const prompt = `Atue como um Especialista em Cadastro de Produtos em Marketplace.
        Crie um anúncio completo para o produto: "${productName}".
            Categoria: "${category || 'Geral'}".
        Características fornecidas: "${characteristics || 'Produto padrão'}".

            Gere:
        1. 3 Títulos SEO(Um focado em ML < 60 chars, um focado em Amazon, um focado em conversão).
        2. Uma Descrição vendedora(Copywriting) com Bullet Points e quebra de objeções.
        3. Uma Ficha Técnica "Tentativa"(Specs): Estime Peso, Medidas, Voltagem, Material com base no tipo de produto(se não informado).

        Schema JSON:
        {
            "titles": ["string"],
                "description": "string (markdown)",
                    "specs": { "key": "value" }
        } `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        titles: { type: Type.ARRAY, items: { type: Type.STRING } },
                        description: { type: Type.STRING },
                        specs: {
                            type: Type.OBJECT,
                            properties: {},
                            additionalProperties: true
                        }
                    },
                    required: ["titles", "description", "specs"]
                }
            }
        });

        return JSON.parse(response.text || "{}") as MagicListingResult;

    } catch (e) {
        console.error("Erro no Magic Builder:", e);
        throw e;
    }
}
