export interface VehicleReception {
  id: number;
  date: string;
  day_of_week: string;
  company_name: string;
  number_of_vehicles: number;
  water_type: string;
  total_quantity: number;
  arrival_time?: string;
  departure_time?: string;
  exit_time_drilling?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  created_by?: number;
}

export interface VehicleReceptionCreate {
  date: string;
  company_name: string;
  number_of_vehicles: number;
  water_type: string;
  total_quantity: number;
  arrival_time?: string;
  departure_time?: string;
  exit_time_drilling?: string;
  notes?: string;
}

export interface VehicleReceptionUpdate {
  date?: string;
  company_name?: string;
  number_of_vehicles?: number;
  water_type?: string;
  total_quantity?: number;
  arrival_time?: string;
  departure_time?: string;
  exit_time_drilling?: string;
  notes?: string;
}

export interface VehicleReceptionList {
  items: VehicleReception[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  role?: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

export interface ReportRequest {
  start_date: string;
  end_date: string;
  report_type: 'daily' | 'weekly' | 'monthly';
  company_filter?: string;
  water_type_filter?: string;
}

export interface ReportSummary {
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  totals: {
    receptions: number;
    vehicles: number;
    quantity: number;
  };
  averages: {
    vehicles_per_day: number;
    quantity_per_day: number;
  };
  breakdowns: {
    companies: Record<string, {
      receptions: number;
      vehicles: number;
      quantity: number;
    }>;
    water_types: Record<string, {
      receptions: number;
      vehicles: number;
      quantity: number;
    }>;
  };
}

export interface ApiError {
  detail: string;
}

export interface FilterOptions {
  company_filter?: string;
  water_type_filter?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  size: number;
}

export interface FinancialReportRequest {
  start_date: string;
  end_date: string;
  company_filter?: string;
}

export interface CompanyFinancialSummary {
  company_name: string;
  total_volume_m3: number;
  rate_per_m3: number;
  total_cost: number;
  reception_count: number;
}

export interface FinancialReportSummary {
  period_start: string;
  period_end: string;
  companies: CompanyFinancialSummary[];
  total_volume_m3: number;
  total_cost: number;
  generated_at: string;
}