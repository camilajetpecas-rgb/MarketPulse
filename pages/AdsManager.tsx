import React from 'react';
import { Construction } from 'lucide-react';

const AdsManager: React.FC = () => {
    return (
        <div className="p-8 max-w-7xl mx-auto text-center mt-20">
            <Construction size={64} className="mx-auto text-blue-500 mb-6" />
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Gestor de ADS (Inteligência)</h1>
            <p className="text-slate-600 text-lg">
                Esta ferramenta está sendo construída e será lançada em breve.
                <br />
                Incluirá Simulador de Bids, Calculadora ROAS e Auditoria de Campanhas.
            </p>
        </div>
    );
};

export default AdsManager;
