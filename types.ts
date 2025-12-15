
export interface AdTag {
  label: string;
  type: 'positive' | 'negative' | 'neutral';
  description?: string;
}

export interface AdAnalysisResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  seoKeywords: string[];
  descriptionImprovement: string;
  priceAnalysis: string;
  tags: AdTag[];
  actionPlan: string[];
}

export interface TrendResult {
  overview: string;
  trendingProducts: string[];
  priceRange: string;
  opportunityLevel: 'Baixa' | 'Média' | 'Alta';
  sources: { title: string; uri: string }[];
  marketplaceSpecifics?: {
    mercadoLivre: string[];
    amazon: string[];
    shopee: string[];
  };
}

export interface DimensionSet {
  height: string;
  width: string;
  length: string;
  weight: string;
  source?: 'extracted' | 'estimated';
}

export interface ExtractedAdData {
  title: string;
  price: string;
  description: string;
  platform: Platform;
  seller?: string;
  stock?: string;
  rating?: string;
  reviewsCount?: string;
  itemLocation?: string;
  
  productDimensions?: DimensionSet;
  packageDimensions?: DimensionSet;

  dimensions?: string; 
  dimensionsDetails?: { 
    height: string;
    width: string;
    length: string;
  };
  weight?: string;
  logistics?: string;
  listingAge?: string; 
  salesEstimate?: string; 
}

export interface CopywritingResult {
  optimizedTitles: string[];
  bulletPoints: string[];
  salesPitch: string;
}

export interface CatalogItem {
  productName: string;
  winningPrice: string;
  competitionLevel: 'Baixa' | 'Média' | 'Alta' | 'Extrema';
  tipToWin: string;
  productUrl?: string;
}

export interface TitleBenchmarkResult {
  competitorTitles: { 
      title: string; 
      url: string; 
      platform: string;
      sellerName?: string;
      itemLocation?: string;
  }[]; 
  patternAnalysis: string; 
  suggestedTitles: string[]; 
  highVolumeKeywords: string[]; 
}

export interface GeoTrendResult {
  topRegions: { region: string; interestLevel: number }[]; 
  relatedQueries: string[]; 
  seasonalInsight: string; 
}

// Interface de Usuário para Autenticação
export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Usado apenas internamente no serviço, não exposto no app
  role: 'admin' | 'user';
  createdAt: string;
}

export enum Platform {
  MERCADO_LIVRE = 'Mercado Livre',
  AMAZON = 'Amazon',
  SHOPEE = 'Shopee',
  GENERIC = 'Geral'
}
