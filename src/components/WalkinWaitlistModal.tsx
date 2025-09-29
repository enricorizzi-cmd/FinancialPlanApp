import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { XCircleIcon } from './icons/Icons';

interface WalkinWaitlistModalProps {
  onClose: () => void;
}

const WalkinWaitlistModal: React.FC<WalkinWaitlistModalProps> = ({ onClose }) => {
  const { addWaitlistEntry, showNotification } = useAppContext();
  const [formData, setFormData] = useState({
    guestName: '',
    partySize: 2,
    phone: '',
    quotedWaitTime: 15
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.guestName.trim()) {
      showNotification('Nome cliente richiesto', 'error');
      return;
    }

    try {
      await addWaitlistEntry(formData);
      onClose();
    } catch (error) {
      showNotification('Errore nell\'aggiunta alla lista d\'attesa', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Accogli Cliente</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircleIcon className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Cliente *
            </label>
            <input
              type="text"
              value={formData.guestName}
              onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Nome del cliente"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Numero Persone
            </label>
            <select
              value={formData.partySize}
              onChange={(e) => setFormData({ ...formData, partySize: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {[1,2,3,4,5,6,7,8,9,10].map(num => (
                <option key={num} value={num}>{num} {num === 1 ? 'persona' : 'persone'}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefono
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Numero di telefono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attesa Stimata (minuti)
            </label>
            <select
              value={formData.quotedWaitTime}
              onChange={(e) => setFormData({ ...formData, quotedWaitTime: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value={5}>5 minuti</option>
              <option value={10}>10 minuti</option>
              <option value={15}>15 minuti</option>
              <option value={20}>20 minuti</option>
              <option value={30}>30 minuti</option>
              <option value={45}>45 minuti</option>
              <option value={60}>1 ora</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Aggiungi alla Lista
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WalkinWaitlistModal;
