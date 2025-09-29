import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Company } from '../types';

interface CompanySelectorProps {
  onCompanySelect?: (company: Company) => void;
}

const CompanySelector: React.FC<CompanySelectorProps> = ({ onCompanySelect }) => {
  const { companies, currentCompany, setCurrentCompany, addCompany, showNotification } = useAppContext();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyDescription, setNewCompanyDescription] = useState('');

  const handleCompanyChange = async (companyId: string) => {
    await setCurrentCompany(companyId);
    const selectedCompany = companies.find(c => c.id === companyId);
    if (selectedCompany && onCompanySelect) {
      onCompanySelect(selectedCompany);
    }
  };

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) {
      showNotification('Il nome dell\'azienda è obbligatorio', 'error');
      return;
    }

    try {
      await addCompany({
        name: newCompanyName.trim(),
        description: newCompanyDescription.trim() || undefined,
      });
      setNewCompanyName('');
      setNewCompanyDescription('');
      setShowAddForm(false);
    } catch (error) {
      showNotification('Errore nella creazione dell\'azienda', 'error');
    }
  };

  if (companies.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Gestione Aziende</h2>
        <p className="text-gray-600 mb-4">Nessuna azienda configurata. Crea la tua prima azienda per iniziare.</p>
        
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-600"
          >
            Crea Prima Azienda
          </button>
        ) : (
          <form onSubmit={handleAddCompany} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Azienda *
              </label>
              <input
                type="text"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Inserisci il nome dell'azienda"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrizione
              </label>
              <textarea
                value={newCompanyDescription}
                onChange={(e) => setNewCompanyDescription(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Descrizione opzionale dell'azienda"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-600"
              >
                Crea Azienda
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewCompanyName('');
                  setNewCompanyDescription('');
                }}
                className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-300"
              >
                Annulla
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Gestione Aziende</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-600"
        >
          {showAddForm ? 'Annulla' : '+ Nuova Azienda'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddCompany} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Azienda *
            </label>
            <input
              type="text"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Inserisci il nome dell'azienda"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrizione
            </label>
            <textarea
              value={newCompanyDescription}
              onChange={(e) => setNewCompanyDescription(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Descrizione opzionale dell'azienda"
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-600"
            >
              Crea Azienda
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setNewCompanyName('');
                setNewCompanyDescription('');
              }}
              className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-300"
            >
              Annulla
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Azienda Corrente
        </label>
        <select
          value={currentCompany?.id || ''}
          onChange={(e) => handleCompanyChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
        
        {currentCompany && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900">{currentCompany.name}</h3>
            {currentCompany.description && (
              <p className="text-sm text-blue-700 mt-1">{currentCompany.description}</p>
            )}
            <p className="text-xs text-blue-600 mt-2">
              Creata: {new Date(currentCompany.createdAt).toLocaleDateString('it-IT')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanySelector;
