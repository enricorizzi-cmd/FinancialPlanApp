import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AppProvider } from './contexts/AppContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MobileNav from './components/MobileNav';
import NotificationContainer from './components/NotificationContainer';
import WalkinWaitlistModal from './components/WalkinWaitlistModal';

const Dashboard = lazy(() => import('./components/Dashboard'));
const FinancialPlan = lazy(() => import('./components/FinancialPlan'));

type Page = 'dashboard' | 'financial-plan';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isWalkinModalOpen, setIsWalkinModalOpen] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as Page;
      if (['dashboard', 'financial-plan'].includes(hash)) {
        setCurrentPage(hash);
      } else {
        setCurrentPage('dashboard');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initial check

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'financial-plan':
        return <FinancialPlan />;
      case 'dashboard':
      default:
        return <Dashboard />;
    }
  };

  return (
    <AppProvider>
      <div className="flex h-screen bg-dark text-white relative">
        {/* Gaming background effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-dark via-dark-100 to-dark-200 opacity-50"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,229,255,0.1),transparent_50%)]"></div>
        
        <Sidebar currentPage={currentPage} />
        <div className="flex-1 flex flex-col overflow-hidden relative z-10">
          <Header onOpenWalkinModal={() => setIsWalkinModalOpen(true)} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-dark-50 p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
            <Suspense fallback={
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-primary-300">Caricamento...</p>
                </div>
              </div>
            }>
              {renderPage()}
            </Suspense>
          </main>
        </div>
        <MobileNav currentPage={currentPage} />
        <NotificationContainer />
        {isWalkinModalOpen && <WalkinWaitlistModal onClose={() => setIsWalkinModalOpen(false)} />}
      </div>
    </AppProvider>
  );
};

export default App;