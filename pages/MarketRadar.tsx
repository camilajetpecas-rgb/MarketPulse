import React from 'react';
import { Construction } from 'lucide-react';

const MarketRadar: React.FC = () => {
    return (
        <div className="p-8 max-w-7xl mx-auto text-center mt-20">
            <Construction size={64} className="mx-auto text-emerald-500 mb-6" />
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Radar de Mercado (Deep Research)</h1>
            <p className="text-slate-600 text-lg">
                Esta ferramenta está sendo construída e será lançada em breve.
                <br />
                Análise profunda de tendências, mapa de preços e concorrentes.
            </p>
        </div>
    );
};

export default MarketRadar;
