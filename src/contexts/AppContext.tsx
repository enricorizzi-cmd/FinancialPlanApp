import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Company, AppContextType, AppNotification, NotificationType } from '../types';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentCompany, setInternalCurrentCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const showNotification = useCallback((message: string, type: NotificationType) => {
    const newNotification: AppNotification = {
      id: Date.now(),
      message,
      type,
    };
    setNotifications(prev => [...prev, newNotification]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 5000);
  }, []);

  const setCurrentCompany = async (companyId: string) => {
    const newCompany = companies.find(c => c.id === companyId);
    if (newCompany) {
      setInternalCurrentCompany(newCompany);
      // Store current company in localStorage
      localStorage.setItem('currentCompanyId', companyId);
    }
  };

  const addCompany = async (companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCompany: Company = {
      ...companyData,
      id: `company_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const updatedCompanies = [...companies, newCompany];
    setCompanies(updatedCompanies);
    localStorage.setItem('companies', JSON.stringify(updatedCompanies));
    showNotification(`Azienda "${newCompany.name}" creata con successo!`, 'success');
    
    // If this is the first company, set it as current
    if (companies.length === 0) {
      setInternalCurrentCompany(newCompany);
      localStorage.setItem('currentCompanyId', newCompany.id);
    }
  };

  const updateCompany = async (companyId: string, companyData: Partial<Company>) => {
    const updatedCompanies = companies.map(c => 
      c.id === companyId 
        ? { ...c, ...companyData, updatedAt: new Date().toISOString() }
        : c
    );
    setCompanies(updatedCompanies);
    localStorage.setItem('companies', JSON.stringify(updatedCompanies));
    
    if (currentCompany?.id === companyId) {
      setInternalCurrentCompany(updatedCompanies.find(c => c.id === companyId) || null);
    }
    
    showNotification('Azienda aggiornata con successo!', 'success');
  };

  const deleteCompany = async (companyId: string) => {
    const updatedCompanies = companies.filter(c => c.id !== companyId);
    setCompanies(updatedCompanies);
    localStorage.setItem('companies', JSON.stringify(updatedCompanies));
    
    if (currentCompany?.id === companyId) {
      const newCurrentCompany = updatedCompanies.length > 0 ? updatedCompanies[0] : null;
      setInternalCurrentCompany(newCurrentCompany);
      localStorage.setItem('currentCompanyId', newCurrentCompany?.id || '');
    }
    
    showNotification('Azienda eliminata con successo!', 'success');
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load companies from localStorage
        const storedCompanies = localStorage.getItem('companies');
        if (storedCompanies) {
          const parsedCompanies = JSON.parse(storedCompanies);
          setCompanies(parsedCompanies);
          
          // Load current company
          const currentCompanyId = localStorage.getItem('currentCompanyId');
          if (currentCompanyId && parsedCompanies.length > 0) {
            const current = parsedCompanies.find((c: Company) => c.id === currentCompanyId);
            if (current) {
              setInternalCurrentCompany(current);
            } else {
              setInternalCurrentCompany(parsedCompanies[0]);
              localStorage.setItem('currentCompanyId', parsedCompanies[0].id);
            }
          } else if (parsedCompanies.length > 0) {
            setInternalCurrentCompany(parsedCompanies[0]);
            localStorage.setItem('currentCompanyId', parsedCompanies[0].id);
          }
        }
      } catch (e) {
        setError('Inizializzazione dei dati dell\'applicazione fallita.');
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    initializeApp();
  }, []);

  return (
    <AppContext.Provider value={{ 
      companies, 
      currentCompany, 
      loading, 
      error, 
      notifications, 
      showNotification, 
      setCurrentCompany, 
      addCompany, 
      updateCompany, 
      deleteCompany 
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
