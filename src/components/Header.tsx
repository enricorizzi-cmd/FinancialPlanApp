import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { PlusIcon } from './icons/Icons';

interface HeaderProps {
  onOpenWalkinModal: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenWalkinModal }) => {
  const { currentLocation, locations, setCurrentLocation, loading } = useAppContext();

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentLocation(e.target.value);
  };

  return (
    <header className="flex items-center justify-between h-16 px-6 bg-dark-100 border-b border-primary-800 gap-4 shadow-lg">
      <h2 className="text-xl font-semibold text-primary-300 hidden sm:block truncate">{currentLocation?.name || 'Caricamento...'}</h2>
      <div className="flex-1 flex justify-end items-center gap-4">
        <select
          value={currentLocation?.id || ''}
          onChange={handleLocationChange}
          disabled={loading || locations.length <= 1}
          className="bg-dark-200 border border-primary-700 rounded-2xl shadow-lg py-2 px-3 text-sm font-medium text-primary-300 hover:bg-dark-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-dark-400 transition-all duration-200"
          aria-label="Seleziona una sede"
        >
          {locations.map(loc => (
            <option key={loc.id} value={loc.id} className="bg-dark-200 text-primary-300">{loc.name}</option>
          ))}
        </select>
         <button 
          onClick={onOpenWalkinModal}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-2xl shadow-lg text-dark bg-primary hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transform hover:scale-105 transition-all duration-200"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Accogli Cliente
        </button>
      </div>
    </header>
  );
};

export default Header;
