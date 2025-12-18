import React from 'react';
import { Construction } from 'lucide-react';

const ListingWizard: React.FC = () => {
    return (
        <div className="p-8 max-w-7xl mx-auto text-center mt-20">
            <Construction size={64} className="mx-auto text-purple-500 mb-6" />
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Criador de Anúncios 2.0 (Magic Builder)</h1>
            <p className="text-slate-600 text-lg">
                Esta ferramenta está sendo construída e será lançada em breve.
                <br />
                Gerador automático de títulos, descrições e fichas técnicas para ML, Shopee e Amazon.
            </p>
        </div>
    );
};

export default ListingWizard;
