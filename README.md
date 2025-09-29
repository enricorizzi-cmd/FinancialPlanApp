# Financial Plan App

Una applicazione per la gestione del piano finanziario multiazienda, estratta da RistoManagerPro.

## Caratteristiche

- **Gestione Multiazienda**: Crea e gestisci più aziende
- **Piano Finanziario**: Gestione completa del piano mensile con preventivo e consuntivo
- **Catalogo Causali**: Organizzazione delle causali finanziarie
- **Business Plan**: Strumenti per la pianificazione aziendale
- **Statistiche**: Analisi e reportistica finanziaria

## Tecnologie

- **Frontend**: React 19, TypeScript, Vite
- **UI**: Tailwind CSS
- **Charts**: Recharts
- **Date**: date-fns
- **State**: React Context

## Installazione

1. Installa le dipendenze:
```bash
npm install
```

2. Avvia l'applicazione in modalità sviluppo:
```bash
npm run dev
```

3. L'applicazione sarà disponibile su http://localhost:3000

## Scripts Disponibili

- `npm run dev` - Avvia il server di sviluppo
- `npm run build` - Crea la build di produzione
- `npm run preview` - Anteprima della build di produzione
- `npm run lint` - Esegue il linting del codice
- `npm run lint:fix` - Corregge automaticamente gli errori di linting
- `npm run format` - Formatta il codice con Prettier
- `npm run type-check` - Verifica i tipi TypeScript

## Struttura del Progetto

```
src/
├── components/          # Componenti React
│   ├── CompanySelector.tsx
│   ├── FinancialPlan.tsx
│   └── NotificationContainer.tsx
├── contexts/           # Context React per lo stato globale
│   └── AppContext.tsx
├── data/              # Dati e tipi per il piano finanziario
│   └── financialPlanData.ts
├── services/          # Servizi API
│   └── financialPlanApi.ts
├── types.ts           # Tipi TypeScript
├── utils/             # Utility functions
├── App.tsx            # Componente principale
└── index.tsx          # Entry point
```

## Funzionalità

### Gestione Aziende
- Creazione di nuove aziende
- Selezione dell'azienda corrente
- Gestione delle informazioni aziendali

### Piano Finanziario
- **Panoramica**: Dashboard con KPI e grafici
- **Piano Mensile**: Gestione preventivo/consuntivo per mese
- **Causali**: Catalogo delle causali finanziarie
- **Business Plan**: Strumenti di pianificazione
- **Statistiche**: Report e analisi

### Caratteristiche Tecniche
- Persistenza dati in localStorage
- Notifiche in tempo reale
- Interfaccia responsive
- Gestione dello stato con React Context
- TypeScript per type safety

## Sviluppo

L'applicazione è stata estratta da RistoManagerPro mantenendo:
- La logica del piano finanziario
- I componenti di visualizzazione
- I servizi API
- La gestione dello stato

Aggiunte nuove funzionalità:
- Gestione multiazienda
- Interfaccia semplificata
- Miglioramenti UX/UI

## Contribuire

1. Fork del repository
2. Crea un branch per la feature (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request
