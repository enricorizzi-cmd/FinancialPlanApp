import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import {
  financialPlanRows,
  financialCausali,
  financialStats as financialStatsRows,
  FinancialCausaleGroup,
  FinancialStatsRow,
} from '../data/financialPlanData';
import { fetchFinancialPlanState, persistFinancialPlanState, type FinancialPlanStatePayload } from '../services/financialPlanApi';
import { useAppContext } from '../contexts/AppContext';
import { PlanOverrides, StatsOverrides, TabKey } from '../types';

const MONTH_NAMES = [
  'Gennaio',
  'Febbraio',
  'Marzo',
  'Aprile',
  'Maggio',
  'Giugno',
  'Luglio',
  'Agosto',
  'Settembre',
  'Ottobre',
  'Novembre',
  'Dicembre',
];

const MONTH_SHORT = [
  'Gen',
  'Feb',
  'Mar',
  'Apr',
  'Mag',
  'Giu',
  'Lug',
  'Ago',
  'Set',
  'Ott',
  'Nov',
  'Dic',
];

const MONTH_MAP: Record<string, number> = {
  GENNAIO: 0,
  FEBBRAIO: 1,
  MARZO: 2,
  APRILE: 3,
  MAGGIO: 4,
  GIUGNO: 5,
  LUGLIO: 6,
  AGOSTO: 7,
  SETTEMBRE: 8,
  OTTOBRE: 9,
  NOVEMBRE: 10,
  DICEMBRE: 11,
};

const currencyFormatter = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const round2 = (value: number): number => Math.round(value * 100) / 100;

const normalizeLabel = (value: string): string => value.trim().toUpperCase();

const parsePlanMonthLabel = (
  label: string,
): { year: number; monthIndex: number } | null => {
  if (!label) {
    return null;
  }
  const parts = label.trim().split(/\s+/);
  if (parts.length < 2) {
    return null;
  }
  const year = Number(parts[parts.length - 1]);
  const monthName = normalizeLabel(parts.slice(0, parts.length - 1).join(' '));
  const monthIndex = MONTH_MAP[monthName];
  if (Number.isNaN(year) || monthIndex === undefined) {
    return null;
  }
  return { year, monthIndex };
};

const buildMonthKey = (year: number, monthIndex: number): string => `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

const parseMonthKey = (
  key: string,
): { year: number; monthIndex: number } | null => {
  const [yearPart, monthPart] = key.split('-');
  const year = Number(yearPart);
  const monthIndex = Number(monthPart) - 1;
  if (Number.isNaN(year) || Number.isNaN(monthIndex)) {
    return null;
  }
  return { year, monthIndex };
};

const formatCurrencyValue = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return '-';
  }
  if (Math.abs(value) < 0.005) {
    return '-';
  }
  return currencyFormatter.format(value);
};

const parseNumberInput = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const normalized = trimmed.replace(/,/g, '.');
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? null : parsed;
};

const calcRatios = (values: number[]): number[] => {
  const total = values.reduce((acc, value) => acc + value, 0);
  if (values.length === 0) {
    return [];
  }
  if (total === 0) {
    return values.map(() => 1 / values.length);
  }
  return values.map((value) => value / total);
};

interface PlanMonthEntry {
  monthIndex: number;
  consuntivo: number;
  preventivo: number;
}

interface PlanDetailRow {
  macro: string;
  category: string;
  detail: string;
  months: PlanMonthEntry[];
}

interface PlanMacroBlock {
  macro: string;
  details: PlanDetailRow[];
}

interface PlanYearData {
  year: number;
  macros: PlanMacroBlock[];
  totals: Record<string, { consuntivo: number[]; preventivo: number[] }>;
}

interface BusinessPlanYearMetrics {
  fatturatoTotale: number;
  monthlyFatturato: number[];
  incassato: number;
  monthlyIncassato: number[];
  costiFissi: number;
  monthlyCostiFissi: number[];
  costiVariabili: number;
  monthlyCostiVariabili: number[];
}

interface BusinessPlanDraft {
  baseYear: number;
  targetYear: number;
  fatturatoIncrement: number;
  fatturatoPrevisionale: number;
  incassatoPercent: number;
  incassatoPrevisionale: number;
  costiFissiPercent: number;
  costiFissiPrevisionale: number;
  costiVariabiliPercent: number;
  costiVariabiliPrevisionale: number;
}

type BusinessPlanDrafts = Record<string, BusinessPlanDraft>;

interface BusinessPlanFormState {
  baseYear: number | null;
  targetYear: number;
  fatturatoIncrement: string;
  fatturatoPrevisionale: string;
  incassatoPercent: string;
  incassatoPrevisionale: string;
  costiFissiPercent: string;
  costiFissiPrevisionale: string;
  costiVariabiliPercent: string;
  costiVariabiliPrevisionale: string;
  utilePrevisionale: string;
  utilePercent: string;
}

interface BusinessPlanMessage {
  type: 'success' | 'info' | 'error';
  text: string;
}

const buildDetailMeta = (causaliCatalog: FinancialCausaleGroup[]) => {
  const map = new Map<string, { macro: string; category: string }>();
  causaliCatalog.forEach((group: FinancialCausaleGroup) => {
    group.categories.forEach((category) => {
      category.items.forEach((item) => {
        map.set(normalizeLabel(item), {
          macro: group.macroCategory,
          category: category.name,
        });
      });
    });
  });
  return map;
};

const computePlanData = (
  detailMeta: Map<string, { macro: string; category: string }>,
): Map<number, PlanYearData> => {
  const yearMap = new Map<number, Map<string, Map<string, PlanDetailRow>>>();

  financialPlanRows.forEach((row) => {
    const meta = detailMeta.get(normalizeLabel(row.detail)) ?? {
      macro: row.macroCategory,
      category: 'Altro',
    };

    row.months.forEach((monthValue) => {
      const parsed = parsePlanMonthLabel(monthValue.month);
      if (!parsed) {
        return;
      }
      const { year, monthIndex } = parsed;

      if (!yearMap.has(year)) {
        yearMap.set(year, new Map());
      }
      const macroMap = yearMap.get(year)!;

      if (!macroMap.has(meta.macro)) {
        macroMap.set(meta.macro, new Map());
      }
      const detailKey = `${meta.category}__${row.detail}`;
      const detailMap = macroMap.get(meta.macro)!;

      if (!detailMap.has(detailKey)) {
        detailMap.set(detailKey, {
          macro: meta.macro,
          category: meta.category,
          detail: row.detail,
          months: new Array<PlanMonthEntry>(12).fill(null).map((_, idx) => ({
            monthIndex: idx,
            consuntivo: 0,
            preventivo: 0,
          })),
        });
      }
      const detailEntry = detailMap.get(detailKey)!;
      detailEntry.months[monthIndex] = {
        monthIndex,
        consuntivo: monthValue.consuntivo ?? 0,
        preventivo: monthValue.preventivo ?? monthValue.consuntivo ?? 0,
      };
    });
  });

  const planByYear = new Map<number, PlanYearData>();
  yearMap.forEach((macroMap, year) => {
    const macros: PlanMacroBlock[] = [];
    const totals: PlanYearData['totals'] = {};

    macroMap.forEach((detailMap, macroName) => {
      const details = Array.from(detailMap.values());
      macros.push({ macro: macroName, details });

      totals[macroName] = {
        consuntivo: new Array(12).fill(0),
        preventivo: new Array(12).fill(0),
      };

      details.forEach((detail) => {
        detail.months.forEach((month) => {
          totals[macroName].consuntivo[month.monthIndex] += month.consuntivo;
          totals[macroName].preventivo[month.monthIndex] += month.preventivo;
        });
      });
    });

    planByYear.set(year, { year, macros, totals });
  });

  return planByYear;
};

const computeYearMetrics = (
  planByYear: Map<number, PlanYearData>,
): Map<number, BusinessPlanYearMetrics> => {
  const metrics = new Map<number, BusinessPlanYearMetrics>();

  planByYear.forEach((planYear, year) => {
    const incassato = planYear.totals['INCASSATO']?.consuntivo ?? new Array(12).fill(0);
    const costiFissi = planYear.totals['COSTI FISSI']?.consuntivo ?? new Array(12).fill(0);
    const costiVariabili = planYear.totals['COSTI VARIABILI']?.consuntivo ?? new Array(12).fill(0);

    metrics.set(year, {
      fatturatoTotale: 0,
      monthlyFatturato: new Array(12).fill(0),
      incassato: incassato.reduce((acc, value) => acc + value, 0),
      monthlyIncassato: [...incassato],
      costiFissi: costiFissi.reduce((acc, value) => acc + value, 0),
      monthlyCostiFissi: [...costiFissi],
      costiVariabili: costiVariabili.reduce((acc, value) => acc + value, 0),
      monthlyCostiVariabili: [...costiVariabili],
    });
  });

  financialStatsRows.forEach((row) => {
    const parsed = parsePlanMonthLabel(row.month);
    if (!parsed) {
      return;
    }
    const { year, monthIndex } = parsed;
    if (!metrics.has(year)) {
      metrics.set(year, {
        fatturatoTotale: 0,
        monthlyFatturato: new Array(12).fill(0),
        incassato: 0,
        monthlyIncassato: new Array(12).fill(0),
        costiFissi: 0,
        monthlyCostiFissi: new Array(12).fill(0),
        costiVariabili: 0,
        monthlyCostiVariabili: new Array(12).fill(0),
      });
    }
    const entry = metrics.get(year)!;
    entry.fatturatoTotale += row.fatturatoTotale ?? 0;
    entry.monthlyFatturato[monthIndex] += row.fatturatoTotale ?? 0;
  });

  return metrics;
};

const createBusinessPlanFormFromMetrics = (
  metrics: BusinessPlanYearMetrics | undefined,
  baseYear: number,
  targetYear: number,
): BusinessPlanFormState => {
  if (!metrics) {
    return {
      baseYear,
      targetYear,
      fatturatoIncrement: '0',
      fatturatoPrevisionale: '0.00',
      incassatoPercent: '0.00',
      incassatoPrevisionale: '0.00',
      costiFissiPercent: '0.00',
      costiFissiPrevisionale: '0.00',
      costiVariabiliPercent: '0.00',
      costiVariabiliPrevisionale: '0.00',
      utilePrevisionale: '0.00',
      utilePercent: '0.00',
    };
  }

  const fatturato = metrics.fatturatoTotale;
  const incassato = metrics.incassato;
  const costiFissi = metrics.costiFissi;
  const costiVariabili = metrics.costiVariabili;
  const utile = incassato - costiFissi - costiVariabili;

  return {
    baseYear,
    targetYear,
    fatturatoIncrement: '0',
    fatturatoPrevisionale: round2(fatturato).toFixed(2),
    incassatoPercent:
      fatturato === 0 ? '0.00' : round2((incassato / fatturato) * 100).toFixed(2),
    incassatoPrevisionale: round2(incassato).toFixed(2),
    costiFissiPercent:
      incassato === 0 ? '0.00' : round2((costiFissi / incassato) * 100).toFixed(2),
    costiFissiPrevisionale: round2(costiFissi).toFixed(2),
    costiVariabiliPercent:
      incassato === 0 ? '0.00' : round2((costiVariabili / incassato) * 100).toFixed(2),
    costiVariabiliPrevisionale: round2(costiVariabili).toFixed(2),
    utilePrevisionale: round2(utile).toFixed(2),
    utilePercent:
      incassato === 0 ? '0.00' : round2((utile / incassato) * 100).toFixed(2),
  };
};

const createBusinessPlanFormFromDraft = (
  draft: BusinessPlanDraft,
): BusinessPlanFormState => {
  const utile =
    draft.incassatoPrevisionale -
    draft.costiFissiPrevisionale -
    draft.costiVariabiliPrevisionale;

  return {
    baseYear: draft.baseYear,
    targetYear: draft.targetYear,
    fatturatoIncrement: draft.fatturatoIncrement.toFixed(2),
    fatturatoPrevisionale: draft.fatturatoPrevisionale.toFixed(2),
    incassatoPercent: draft.incassatoPercent.toFixed(2),
    incassatoPrevisionale: draft.incassatoPrevisionale.toFixed(2),
    costiFissiPercent: draft.costiFissiPercent.toFixed(2),
    costiFissiPrevisionale: draft.costiFissiPrevisionale.toFixed(2),
    costiVariabiliPercent: draft.costiVariabiliPercent.toFixed(2),
    costiVariabiliPrevisionale: draft.costiVariabiliPrevisionale.toFixed(2),
    utilePrevisionale: round2(utile).toFixed(2),
    utilePercent:
      draft.incassatoPrevisionale === 0
        ? '0.00'
        : round2((utile / draft.incassatoPrevisionale) * 100).toFixed(2),
  };
};

const FinancialPlan: React.FC = () => {
  const { showNotification } = useAppContext();
  const detailMeta = useMemo(() => buildDetailMeta(financialCausali as any), []);
  const basePlanByYear = useMemo(() => computePlanData(detailMeta), [detailMeta]);
  const yearMetrics = useMemo(
    () => computeYearMetrics(basePlanByYear),
    [basePlanByYear],
  );
  const [planOverrides, setPlanOverrides] = useState<PlanOverrides>({});
  const [consuntivoOverrides, setConsuntivoOverrides] = useState<PlanOverrides>({});
  const [statsOverrides, setStatsOverrides] = useState<StatsOverrides>({});
  const [loadingState, setLoadingState] = useState<boolean>(false);
  const [savingState, setSavingState] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [onlyValued, setOnlyValued] = useState<boolean>(false);
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set());
  const [businessPlanDrafts, setBusinessPlanDrafts] = useState<BusinessPlanDrafts>({});
  const [causaliCatalog, setCausaliCatalog] = useState<FinancialCausaleGroup[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [businessPlanForm, setBusinessPlanForm] = useState<BusinessPlanFormState | null>(null);
  const [businessPlanMessage, setBusinessPlanMessage] = useState<BusinessPlanMessage | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoadingState(true);
    fetchFinancialPlanState().then((payload) => {
      if (!mounted || !payload) {
        setLoadingState(false);
        return;
      }
      setPlanOverrides(payload.preventivoOverrides ?? {});
      setConsuntivoOverrides((payload as FinancialPlanStatePayload).consuntivoOverrides ?? {});
      setStatsOverrides(payload.statsOverrides ?? {});
      setCausaliCatalog(
        payload.causaliCatalog && payload.causaliCatalog.length > 0
          ? (payload.causaliCatalog as FinancialCausaleGroup[])
          : (financialCausali as unknown as FinancialCausaleGroup[]),
      );
      setLoadingState(false);
    }).catch(() => setLoadingState(false));
    return () => { mounted = false; };
  }, []);

  // Persist handled explicitly on Save; keep localStorage sync for drafts only
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem('financialPlan.businessPlanDrafts', JSON.stringify(businessPlanDrafts));
  }, [businessPlanDrafts]);

  const availableYears = useMemo(
    () => Array.from(basePlanByYear.keys()).sort((a: number, b: number) => a - b),
    [basePlanByYear],
  );

  const latestYear =
    availableYears.length > 0
      ? availableYears[availableYears.length - 1]
      : new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(latestYear);

  useEffect(() => {
    if (!basePlanByYear.has(selectedYear)) {
      setSelectedYear(latestYear);
    }
  }, [basePlanByYear, selectedYear, latestYear]);

  const completeYears = useMemo(() => {
    const years: number[] = [];
    yearMetrics.forEach((metrics, year) => {
      const hasMonths =
        (metrics as any).monthlyIncassato?.length === 12 &&
        (metrics as any).monthlyCostiFissi?.length === 12 &&
        metrics.monthlyCostiVariabili.length === 12;
      if (hasMonths) {
        years.push(year);
      }
    });
    return years.sort((a, b) => a - b);
  }, [yearMetrics]);

  const getPlanPreventivoValue = useCallback(
    (
      macro: string,
      category: string,
      detail: string,
      year: number,
      monthIndex: number,
    ): number => {
      const monthKey = buildMonthKey(year, monthIndex);
      const override = planOverrides[macro]?.[category]?.[detail]?.[monthKey];
      if (override !== undefined) {
        return override;
      }
      const planYear = basePlanByYear.get(year);
      const macroBlock = planYear?.macros.find(
        (item) => normalizeLabel(item.macro) === normalizeLabel(macro),
      );
      const detailRow = macroBlock?.details.find(
        (item) => normalizeLabel(item.detail) === normalizeLabel(detail),
      );
      return detailRow?.months[monthIndex].preventivo ?? 0;
    },
    [planOverrides, basePlanByYear],
  );

  const getPlanConsuntivoValue = useCallback(
    (
      macro: string,
      category: string,
      detail: string,
      year: number,
      monthIndex: number,
    ): number => {
      const monthKey = buildMonthKey(year, monthIndex);
      const override = consuntivoOverrides[macro]?.[category]?.[detail]?.[monthKey];
      if (override !== undefined) {
        return override;
      }
      const planYear = basePlanByYear.get(year);
      const macroBlock = planYear?.macros.find(
        (item) => normalizeLabel(item.macro) === normalizeLabel(macro),
      );
      const detailRow = macroBlock?.details.find(
        (item) => normalizeLabel(item.detail) === normalizeLabel(detail),
      );
      return detailRow?.months[monthIndex].consuntivo ?? 0;
    },
    [consuntivoOverrides, basePlanByYear],
  );

  const setOverride = (
    target: 'preventivo' | 'consuntivo',
    macro: string,
    category: string,
    detail: string,
    year: number,
    monthIndex: number,
    value: number | null,
  ) => {
    const monthKey = buildMonthKey(year, monthIndex);
    const setter = target === 'preventivo' ? setPlanOverrides : setConsuntivoOverrides;
    setter((prev) => {
      const next = { ...prev } as PlanOverrides;
      if (!next[macro]) next[macro] = {} as any;
      if (!next[macro][category]) next[macro][category] = {} as any;
      if (!next[macro][category][detail]) next[macro][category][detail] = {} as any;
      if (value === null) {
        delete next[macro][category][detail][monthKey];
      } else {
        next[macro][category][detail][monthKey] = value;
      }
      return { ...next };
    });
    if (!editMode) {
      setEditMode(true);
    }
    setDirtyKeys((prev) => {
      const next = new Set(prev);
      next.add(`${target}|${macro}|${category}|${detail}|${monthKey}`);
      return next;
    });
  };

  const handleSavePlan = async () => {
    setSavingState(true);
    try {
      // Build audit log entries for changed overrides in the selected year only
      const buildAudit = (target: 'preventivo' | 'consuntivo'): { id: string; createdAt: string; year: number; month: number; macroCategory: string; category: string; causale: string; value: number }[] => {
        const out: any[] = [];
        const source = target === 'preventivo' ? planOverrides : consuntivoOverrides;
        Object.entries(source).forEach(([macro, categories]) => {
          Object.entries(categories).forEach(([category, details]) => {
            Object.entries(details).forEach(([detail, months]) => {
              Object.entries(months).forEach(([monthKey, value]) => {
                const parsed = parseMonthKey(monthKey);
                if (!parsed) return;
                if (parsed.year !== selectedYear) return;
                out.push({
                  id: `${target}-${macro}-${category}-${detail}-${monthKey}`,
                  createdAt: new Date().toISOString(),
                  year: parsed.year,
                  month: parsed.monthIndex + 1,
                  macroCategory: macro,
                  category,
                  causale: detail,
                  value,
                });
              });
            });
          });
        });
        return out;
      };

      const payload: FinancialPlanStatePayload = {
        preventivoOverrides: planOverrides,
        consuntivoOverrides: consuntivoOverrides,
        manualLog: [...buildAudit('preventivo'), ...buildAudit('consuntivo')],
        monthlyMetrics: [],
        statsOverrides,
        causaliCatalog: causaliCatalog,
        causaliVersion: null,
      };
      await persistFinancialPlanState(payload);
      setEditMode(false);
      showNotification('Piano mensile salvato con successo.', 'success');
      setDirtyKeys(new Set());
    } finally {
      setSavingState(false);
    }
  };

  const handleCancelPlan = () => {
    // Reload from backend
    setLoadingState(true);
    fetchFinancialPlanState().then((payload) => {
      setPlanOverrides(payload?.preventivoOverrides ?? {});
      setConsuntivoOverrides((payload as FinancialPlanStatePayload | null)?.consuntivoOverrides ?? {});
      setStatsOverrides(payload?.statsOverrides ?? {});
      setCausaliCatalog(
        payload && payload.causaliCatalog && payload.causaliCatalog.length > 0
          ? (payload.causaliCatalog as FinancialCausaleGroup[])
          : (financialCausali as unknown as FinancialCausaleGroup[]),
      );
      setEditMode(false);
      setLoadingState(false);
      setDirtyKeys(new Set());
    }).catch(() => setLoadingState(false));
  };

  const planYear = basePlanByYear.get(selectedYear);

  const overviewTotals = useMemo(() => {
    if (!planYear) {
      return {
        incassato: 0,
        costiFissi: 0,
        costiVariabili: 0,
        utile: 0,
      };
    }
    const incassato =
      planYear.totals['INCASSATO']?.consuntivo.reduce((acc, value) => acc + value, 0) ??
      0;
    const costiFissi =
      planYear.totals['COSTI FISSI']?.consuntivo.reduce((acc, value) => acc + value, 0) ??
      0;
    const costiVariabili =
      planYear.totals['COSTI VARIABILI']?.consuntivo.reduce((acc, value) => acc + value, 0) ??
      0;
    return {
      incassato,
      costiFissi,
      costiVariabili,
      utile: incassato - costiFissi - costiVariabili,
    };
  }, [planYear]);

  const overviewChartData = useMemo(() => {
    if (!planYear) {
      return [];
    }
    const incassato = planYear.totals['INCASSATO']?.consuntivo ?? new Array(12).fill(0);
    const costiFissi = planYear.totals['COSTI FISSI']?.consuntivo ?? new Array(12).fill(0);
    const costiVariabili =
      planYear.totals['COSTI VARIABILI']?.consuntivo ?? new Array(12).fill(0);

    return MONTH_SHORT.map((label, index) => ({
      month: `${label} ${String(selectedYear).slice(-2)}` ,
      incassato: incassato[index] ?? 0,
      costiFissi: costiFissi[index] ?? 0,
      costiVariabili: costiVariabili[index] ?? 0,
      utile:
        (incassato[index] ?? 0) -
        (costiFissi[index] ?? 0) -
        (costiVariabili[index] ?? 0),
    }));
  }, [planYear, selectedYear]);

  const renderOverview = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-500">
            Incassato {selectedYear}
          </p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {formatCurrencyValue(overviewTotals.incassato)}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-500">
            Costi fissi {selectedYear}
          </p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {formatCurrencyValue(overviewTotals.costiFissi)}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-500">
            Costi variabili {selectedYear}
          </p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {formatCurrencyValue(overviewTotals.costiVariabili)}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-500">
            Utile {selectedYear}
          </p>
          <p className="mt-1 text-2xl font-semibold text-emerald-700">
            {formatCurrencyValue(overviewTotals.utile)}
          </p>
        </div>
      </div>
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={overviewChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value: number) => currencyFormatter.format(value)} />
            <Line type="monotone" dataKey="incassato" stroke="#2563eb" strokeWidth={2} />
            <Line type="monotone" dataKey="costiFissi" stroke="#f97316" strokeWidth={2} />
            <Line
              type="monotone"
              dataKey="costiVariabili"
              stroke="#facc15"
              strokeWidth={2}
            />
            <Line type="monotone" dataKey="utile" stroke="#047857" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const rowHasAnyValue = (
    macro: string,
    category: string,
    detail: string,
    year: number,
  ): boolean => {
    for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
      const p = getPlanPreventivoValue(macro, category, detail, year, monthIndex);
      const c = getPlanConsuntivoValue(macro, category, detail, year, monthIndex);
      if ((p ?? 0) !== 0 || (c ?? 0) !== 0) return true;
    }
    return false;
  };

  const renderPlan = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-xs font-semibold uppercase text-gray-500">
          Anno
        </label>
        <select
          value={selectedYear}
          onChange={(event) => setSelectedYear(Number(event.target.value))}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {availableYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <label className="ml-4 flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={onlyValued}
            onChange={(e) => setOnlyValued(e.target.checked)}
          />
          Solo valorizzati
        </label>
        {!editMode ? (
          <button
            type="button"
            onClick={() => setEditMode(true)}
            className="ml-auto rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-600"
          >
            Blocca modifiche
          </button>
        ) : (
          <div className="ml-auto flex gap-2">
            {dirtyKeys.size > 0 && (
              <span className="self-center rounded-full bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1">
                Modifiche non salvate • {dirtyKeys.size}
              </span>
            )}
            <button
              type="button"
              onClick={handleSavePlan}
              disabled={savingState}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
            >
              {savingState ? 'Salvataggio…' : 'Salva'}
            </button>
            <button
              type="button"
              onClick={handleCancelPlan}
              className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-slate-300"
            >
              Annulla
            </button>
          </div>
        )}
      </div>
      <div className="overflow-x-auto rounded-2xl bg-white p-5 shadow-sm">
        {loadingState ? (
          <p className="text-sm text-gray-500">Caricamento…</p>
        ) : !planYear ? (
          <p className="text-sm text-gray-500">
            Nessun dato disponibile per la selezione corrente.
          </p>
        ) : (
          <table className="min-w-[1400px] w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-gray-600">
              <tr>
                <th className="px-3 py-3 text-left">CATEGORIA</th>
                {MONTH_NAMES.map((name) => (
                  <th key={name} className="px-3 py-3 text-center" colSpan={2}>
                    {name}
                  </th>
                ))}
              </tr>
              <tr>
                <th className="px-3 py-2"></th>
                {MONTH_NAMES.map((name) => (
                  <React.Fragment key={name}>
                    <th className="px-3 py-2 text-center text-xs font-normal">PREVENTIVO</th>
                    <th className="px-3 py-2 text-center text-xs font-normal">CONSUNTIVO</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {financialCausali.map((group) => (
                <React.Fragment key={group.macroCategory}>
                  <tr className="bg-slate-100 text-xs uppercase text-gray-600">
                    <td className="px-3 py-2" colSpan={1 + MONTH_NAMES.length * 2}>
                      {group.macroCategory}
                    </td>
                  </tr>
                  {group.categories.map((category) => {
                    const planYear = basePlanByYear.get(selectedYear);
                    const macro = planYear?.macros.find(m => m.macro === group.macroCategory);
                    const categoryDetails = macro?.details?.filter(d => d.category === category.name) ?? [];
                    const hasAny = categoryDetails.some((detail) =>
                      rowHasAnyValue(group.macroCategory, category.name, detail.detail, selectedYear),
                    );
                    if (onlyValued && !hasAny) return null;
                    
                    return (
                      <React.Fragment key={`${group.macroCategory}-${category.name}`}>
                        {/* Subtotale categoria */}
                        <tr className="bg-slate-50 font-semibold">
                          <td className="px-3 py-2 text-sm text-gray-700">{category.name}</td>
                          {MONTH_NAMES.map((_, monthIndex) => {
                            const p = categoryDetails.reduce((acc, d) => acc + getPlanPreventivoValue(group.macroCategory, category.name, d.detail, selectedYear, monthIndex), 0);
                            const c = categoryDetails.reduce((acc, d) => acc + getPlanConsuntivoValue(group.macroCategory, category.name, d.detail, selectedYear, monthIndex), 0);
                            return (
                              <React.Fragment key={`subtotal-${monthIndex}`}>
                                <td className="px-3 py-2 text-right text-sm">
                                  <div className="font-semibold text-sky-700">{formatCurrencyValue(p)}</div>
                                </td>
                                <td className="px-3 py-2 text-right text-sm">
                                  <div className="font-semibold text-gray-800">{formatCurrencyValue(c)}</div>
                                </td>
                              </React.Fragment>
                            );
                          })}
                        </tr>
                        {/* Righe causali */}
                        {category.items.map((causale) => {
                          const detail = categoryDetails.find(d => d.detail === causale);
                          if (!detail) return null;
                          
                          return (
                            <tr key={`${category.name}-${causale}`} className="hover:bg-slate-50">
                              <td className="px-3 py-2 text-sm text-gray-700 pl-6">{causale}</td>
                              {detail.months.map((month) => (
                                <React.Fragment key={month.monthIndex}>
                                  <td className="px-3 py-2 text-right text-sm text-gray-700">
                                    {!editMode ? (
                                      <div className="text-sky-700">{formatCurrencyValue(getPlanPreventivoValue(group.macroCategory, category.name, causale, selectedYear, month.monthIndex))}</div>
                                    ) : (
                                      <input 
                                        type="number" 
                                        step="0.01" 
                                        className={`w-28 rounded border px-2 py-1 text-right text-sm ${dirtyKeys.has(`preventivo|${group.macroCategory}|${category.name}|${causale}|${buildMonthKey(selectedYear, month.monthIndex)}`) ? 'border-sky-400 ring-1 ring-sky-200' : 'border-gray-300'}`} 
                                        value={getPlanPreventivoValue(group.macroCategory, category.name, causale, selectedYear, month.monthIndex)} 
                                        onChange={(e) => setOverride('preventivo', group.macroCategory, category.name, causale, selectedYear, month.monthIndex, Number(e.target.value))} 
                                      />
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-right text-sm text-gray-700">
                                    <div className="text-gray-800">{formatCurrencyValue(getPlanConsuntivoValue(group.macroCategory, category.name, causale, selectedYear, month.monthIndex))}</div>
                                  </td>
                                </React.Fragment>
                              ))}
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  const renderCausali = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Catalogo causali</h3>
        <button
          type="button"
          onClick={() => {
            const macro = window.prompt('Nome macro (es. COSTI FISSI)');
            if (!macro) return;
            // handleCausaliPersist([...causaliCatalog, { macroCategory: macro, categories: [] }]);
          }}
          className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white"
        >
          Aggiungi tipologia
        </button>
      </div>
      <div className="space-y-6">
        {causaliCatalog.map((group, gi) => (
          <div key={`${group.macroCategory}-${gi}`} className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold text-gray-800 flex-1">{group.macroCategory}</h4>
            </div>
            <div className="space-y-3">
              {group.categories.map((cat, ci) => (
                <div key={`${cat.name}-${ci}`} className="rounded border border-slate-200">
                  <div className="flex items-center gap-2 p-2 bg-slate-50">
                    <div className="font-medium text-gray-800 flex-1">{cat.name}</div>
                  </div>
                  <div className="p-2 flex flex-wrap gap-2">
                    {cat.items.map((it, ii) => (
                      <div key={`${it}-${ii}`} className="flex items-center gap-2 rounded bg-white border px-2 py-1">
                        <span className="text-sm text-gray-700">{it}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'overview', label: 'Panoramica' },
          { key: 'plan', label: 'Piano Mensile' },
          { key: 'causali', label: 'Causali' },
          { key: 'business-plan', label: 'Business Plan' },
          { key: 'stats', label: 'Statistiche' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as TabKey)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              activeTab === tab.key
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'plan' && renderPlan()}
      {activeTab === 'causali' && renderCausali()}
      {activeTab === 'business-plan' && (
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Business Plan in sviluppo...</p>
        </div>
      )}
      {activeTab === 'stats' && (
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Statistiche in sviluppo...</p>
        </div>
      )}
    </div>
  );
};

export default FinancialPlan;
