// Financial Plan Types
export type TabKey = 'overview' | 'plan' | 'causali' | 'business-plan' | 'stats';

export interface PlanOverrides {
  [macro: string]: {
    [category: string]: {
      [detail: string]: {
        [monthKey: string]: number;
      };
    };
  };
}

export interface StatsOverrides {
  [monthKey: string]: {
    fatturatoPrevisionale?: number | null;
    incassatoPrevisionale?: number | null;
    utilePrevisionale?: number | null;
  };
}

// Company Management Types
export interface Company {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType = 'success' | 'info' | 'error';

export interface AppNotification {
  id: number;
  message: string;
  type: NotificationType;
}

export interface AppContextType {
  companies: Company[];
  currentCompany: Company | null;
  loading: boolean;
  error: string | null;
  notifications: AppNotification[];
  showNotification: (message: string, type: NotificationType) => void;
  setCurrentCompany: (companyId: string) => Promise<void>;
  addCompany: (company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCompany: (companyId: string, company: Partial<Company>) => Promise<void>;
  deleteCompany: (companyId: string) => Promise<void>;
}
