import React, { useState } from 'react';
import { useAppContext } from './contexts/AppContext';
import CompanySelector from './components/CompanySelector';
import FinancialPlan from './components/FinancialPlan';
import NotificationContainer from './components/NotificationContainer';
import { Company } from './types';

const App: React.FC = () => {
  const { currentCompany, loading, error } = useAppContext();
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Financial Plan App
          </h1>
          <p className="text-gray-600">
            Gestione del piano finanziario multiazienda
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <CompanySelector onCompanySelect={handleCompanySelect} />
          </div>
          
          <div className="lg:col-span-3">
            {currentCompany ? (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    Piano Finanziario - {currentCompany.name}
                  </h2>
                  <p className="text-gray-600">
                    Gestisci il piano finanziario per l'azienda selezionata
                  </p>
                </div>
                <FinancialPlan />
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
                <div className="text-gray-400 text-6xl mb-4">📊</div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Seleziona un'azienda
                </h2>
                <p className="text-gray-600">
                  Crea o seleziona un'azienda per iniziare a gestire il piano finanziario
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <NotificationContainer />
    </div>
  );
};

export default App;
