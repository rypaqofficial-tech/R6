import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Type definitions for backend responses
 */
export interface MacroIndicators {
  gdp_growth: number;
  inflation_rate: number;
  lending_rate: number;
  exchange_rate: number;
  timestamp: string;
  aum_at_risk: number;
  dry_powder_efficiency: number;
  model_alpha: number;
}

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
}

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
  status: 'healthy' | 'warning' | 'distress';
  probability_3x_return: number;
  alpha_score: number;
}

export interface Portfolio {
  id: string;
  name: string;
  total_aum: number;
  avg_irr: number;
  performing: number;
  at_risk: number;
  holdings: number;
  companies: PortfolioCompany[];
  total_risk_score: number;
  diversification_score: number;
}

export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  company_id?: string;
  timestamp: string;
}

export interface UploadResponse {
  message: string;
  company_id: string;
  extracted_data: {
    company_name: string;
    sector: string;
    revenue: number;
    ebitda?: number;
    debt?: number;
    enterprise_value?: number;
  };
}

/**
 * API Client for FastAPI backend integration
 */
export const api = {
  get: async <T>(endpoint: string): Promise<T> => {
    try {
      const url = `${API_BASE}${endpoint.startsWith("/") ? endpoint : "/" + endpoint}`;
      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Request failed";
      console.error(`[API GET ${endpoint}]`, message);
      throw error;
    }
  },

  postFormData: async <T>(endpoint: string, formData: FormData): Promise<T> => {
    try {
      const url = `${API_BASE}${endpoint.startsWith("/") ? endpoint : "/" + endpoint}`;
      const response = await fetch(url, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Request failed";
      console.error(`[API POST ${endpoint}]`, message);
      throw error;
    }
  },
};

/**
 * Feature-specific API wrappers
 */
export const dealApi = {
  getOpportunities: () => api.get<DealOpportunity[]>('/api/deals/opportunities'),
};

export const diligenceApi = {
  getReport: (companyId: string) => api.get<DueDiligenceReport>(`/api/diligence/report/${companyId}`),
};

export const portfolioApi = {
  getAll: () => api.get<Portfolio[]>('/api/portfolios'),

  // NEW: Top Sourcing Targets (used by Dashboard)
  getTopSourcingTargets: () => api.get<any[]>('/api/portfolios/top-sourcing-targets'),
};

export const macroApi = {
  getLive: () => api.get<MacroIndicators>('/api/macro/live'),
};

export const alertsApi = {
  getAll: () => api.get<Alert[]>('/api/alerts'),
};

export interface UploadedPDFItem {
  id: number;
  filename: string;
  file_size_mb: number;
  upload_date: string;
  company_id: string | null;
  company_name: string | null;
}

export const uploadApi = {
  uploadPdf: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.postFormData<UploadResponse>('/api/uploads/pdf', formData);
  },
  listUploads: () => api.get<UploadedPDFItem[]>('/api/uploads/list'),
  deleteUpload: async (uploadId: number): Promise<{ message: string; id: number }> => {
    const url = `${API_BASE}/api/uploads/${uploadId}`;
    const response = await fetch(url, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return response.json();
  },
};
