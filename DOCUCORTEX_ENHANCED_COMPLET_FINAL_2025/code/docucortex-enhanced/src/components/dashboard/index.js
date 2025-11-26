// src/components/dashboard/index.js - INDEX DES COMPOSANTS DU DASHBOARD EXÉCUTIF
// Export centralisé de tous les composants du dashboard exécutif

export { default as ExecutiveDashboard } from './ExecutiveDashboard';
export { default as KPIWidget } from './KPIWidget';
export { default as TrendAnalysis } from './TrendAnalysis';
export { default as BenchmarkComparison } from './BenchmarkComparison';
export { default as InsightsPanel } from './InsightsPanel';

// Export des variantes spécialisées de KPIWidget
export { 
    FinancialKPIWidget, 
    PercentageKPIWidget, 
    NumberKPIWidget, 
    SatisfactionKPIWidget, 
    AlertKPIWidget 
} from './KPIWidget';