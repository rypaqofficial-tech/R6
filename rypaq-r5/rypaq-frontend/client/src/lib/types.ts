// Type definitions for Rypaq R1 backend API
// Synced with FastAPI Pydantic models and Chronos-2 forecasting model

// Chronos Model Types
export interface ChronosForecast {
  timestamp: string;
  forecast_value: number;
  confidence_lower: number;
  confidence_upper: number;
  model: string;
}

export interface ChronosMetadata {
  model_version: string;
  last_trained: string;
  accuracy_score: number;
}

// User & Auth
export interface User {
  id: number;
  open_id: string;
  email: string;
  role: "analyst" | "admin" | "investor";
  tier: "free" | "pro" | "enterprise";
  name?: string;
}

// Risk Predictions
export interface PredictionInput {
  gdpGrowth: number;
  inflation: number;
  revenueGrowth: number;
  debtRatio: number;
  volatility: number;
}

export interface ShapValues {
  gdpGrowth: number;
  inflation: number;
  revenueGrowth: number;
  debtRatio: number;
  volatility: number;
}

export interface Prediction {
  id: number;
  user_id: number;
  risk_score: number;
  predicted_irr: number;
  confidence: number;
  risk_label: "Low Risk" | "Moderate Risk" | "High Risk" | "Critical Risk";
  riskAdjustedReturn: number;
  sharpeProxy: number;
  shapValues: ShapValues;
  created_at: string;
}

export interface PredictionResponse {
  riskScore: number;
  predictedIrr: number;
  confidence: number;
  riskLabel: string;
  riskAdjustedReturn: number;
  sharpeProxy: number;
  shapValues: ShapValues;
}

export interface RiskPrediction {
  company_id: string;
  company_name: string;
  risk_score: number;
  probability_of_default: number;
  covenant_breach_risk: number;
  timestamp: string;
  forecast: ChronosForecast[];
  model_version: string;
}

// Deal Sourcing
export interface DealOpportunity {
  id: string;
  company_name: string;
  sector: string;
  probability_3x_return: number;
  sector_momentum: number;
  revenue: number;
  enterprise_value: number;
  alpha_score: number;
  signals: string[];
  created_at: string;
  updated_at: string;
}

export interface TargetMatrixData {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
  label: string;
}

// Valuation
export interface ValuationScenario {
  exit_year: number;
  exit_multiple: number;
  revenue_growth: number;
  moic: number;
  irr: number;
  scenario_name?: string;
}

export interface ValuationDriver {
  name: string;
  current_value: number;
  contribution_to_irr: number;
  min_value: number;
  max_value: number;
}

export interface SensitivityAnalysis {
  exit_year: number;
  exit_multiple: number;
  moic: number;
}

// Due Diligence
export interface DueDiligenceReport {
  company_id: string;
  company_name: string;
  market_risk: number;
  financial_health: number;
  operational_efficiency: number;
  customer_concentration: number;
  macro_sensitivity: number;
  data_integrity_score: number;
  red_flags: string[];
  green_flags: string[];
  created_at: string;
}

export interface EBITDABridge {
  current_ebitda: number;
  synergy_gains: number;
  cost_reductions: number;
  projected_ebitda: number;
}

// Portfolio
export interface Deal {
  id: number;
  name: string;
  sector: string;
  amount: number;
  status: "active" | "closed" | "pending";
  irr: number;
  risk_score: number;
}

export interface PortfolioCompany {
  id: string;
  name: string;
  sector: string;
  valuation: number;
  revenue: number;
  ebitda: number;
  debt: number;
  risk_score: number;
  status: "healthy" | "warning" | "distress";
  probability_of_default: number;
  entry_date: string;
}

export interface Portfolio {
  id: number;
  user_id: number;
  name: string;
  deals: Deal[];
  total_value: number;
  total_irr: number;
  portfolio_risk: number;
}

export interface PortfolioMetrics {
  total_value: number;
  total_debt: number;
  weighted_avg_irr: number;
  portfolio_risk_score: number;
  macro_correlation: number;
}

export interface PortfolioScenario {
  name: string;
  value: number;
  change_percent: number;
}

export interface MacroCorrelation {
  company: string;
  gdp_sensitivity: number;
  inflation_sensitivity: number;
}

// Macro Data
export interface MacroIndicators {
  gdp: number;
  inflation: number;
  lendingRate: number;
  gdpGrowth?: number;
  cbrRate?: number;
  exchangeRate?: number;
  nseIndex?: number;
  timestamp?: string;
  source?: string;
}

export interface MacroForecast {
  indicator: string;
  current_value: number;
  forecast_1m: number;
  forecast_3m: number;
  forecast_6m: number;
  confidence_interval: [number, number];
}

// Alerts
export interface Alert {
  id: number;
  user_id: number;
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
  isRead: boolean;
  createdAt: string;
  relatedId?: number;
  relatedType?: string;
}

export interface CriticalAlert {
  company_name: string;
  alert_type: string;
  severity: number;
  description: string;
  recommended_action: string;
}

// Dashboard
export interface DashboardMetrics {
  aum_at_risk: number;
  dry_powder_efficiency: number;
  model_alpha: number;
}

// User Settings
export interface UserSettings {
  lag_sensitivity: "lag-1" | "lag-2";
  distress_threshold: number;
  benchmark: string;
  excluded_sectors: string[];
  exit_horizon: "3-5" | "5-7" | "10+";
}

// LLM & AI
export interface LLMMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface LLMRequest {
  messages: LLMMessage[];
  tools?: any[];
  max_tokens?: number;
}

export interface LLMResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Health Check
export interface HealthResponse {
  status: "ok" | "error";
  backend: string;
  ai: string;
  timestamp?: string;
}

// API Response Wrappers
export interface ApiSuccessResponse<T> {
  data: T;
  success: true;
}

export interface ApiErrorResponse {
  error: string;
  success: false;
  status: number;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Chart Data Types
export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

export interface WaterfallData {
  name: string;
  value: number;
  fill: string;
}

export interface HeatmapCell {
  x: string;
  y: string;
  value: number;
  color: string;
}

