// This file is auto-generated from the Excel sources in Piano Finanziario - FP
// Run python scripts/generate_financial_data.py to refresh the dataset.

export interface FinancialPlanMonthValue {
  month: string;
  preventivo: number | null;
  consuntivo: number | null;
}

export interface FinancialPlanRow {
  macroCategory: string;
  detail: string;
  months: FinancialPlanMonthValue[];
}

export interface FinancialCausaleCategory {
  name: string;
  items: string[];
}

export interface FinancialCausaleGroup {
  macroCategory: string;
  categories: FinancialCausaleCategory[];
}

export interface FinancialStatsRow {
  month: string;
  fatturatoImponibile: number | null;
  fatturatoTotale: number | null;
  fatturatoPrevisionale?: number | null;
  utileCassa: number | null;
  utilePrevisionale?: number | null;
  incassato: number | null;
  incassatoPrevisionale?: number | null;
  saldoConto: number | null;
  saldoSecondoConto: number | null;
  saldoTotale: number | null;
  creditiPendenti: number | null;
  creditiScaduti: number | null;
  debitiFornitore: number | null;
  debitiBancari: number | null;
}

export const financialPlanRows = [
  {
    "macroCategory": "INCASSATO",
    "detail": "INCASSATO",
    "months": [
      {
        "month": "OTTOBRE 2025",
        "preventivo": null,
        "consuntivo": null
      },
      {
        "month": "NOVEMBRE 2025",
        "preventivo": null,
        "consuntivo": null
      },
      {
        "month": "DICEMBRE 2025",
        "preventivo": null,
        "consuntivo": null
      }
    ]
  }
] as const;

export const financialCausali = [
  {
    "macroCategory": "INCASSATO",
    "categories": [
      {
        "name": "Incassato",
        "items": [
          "Incassato"
        ]
      }
    ]
  },
  {
    "macroCategory": "COSTI FISSI",
    "categories": [
      {
        "name": "Rete vendita, Amministratori, Immobili",
        "items": [
          "Rimborsi spese",
          "Affitto",
          "Enasarco"
        ]
      }
    ]
  },
  {
    "macroCategory": "COSTI VARIABILI",
    "categories": [
      {
        "name": "Fornitori Materiali",
        "items": [
          "nome fornitore",
          "Merce in Acquisto",
          "Freelance",
          "Noleggio Attrezzature",
          "Sub-Appaltatori"
        ]
      }
    ]
  }
] as const;

export const financialStats = [
  {
    "month": "Gen. 24",
    "fatturatoImponibile": null,
    "fatturatoTotale": null,
    "utileCassa": 0.0,
    "incassato": null,
    "saldoConto": null,
    "saldoSecondoConto": null,
    "saldoTotale": null,
    "creditiPendenti": null,
    "creditiScaduti": null,
    "debitiFornitore": null,
    "debitiBancari": null
  }
] as const;
