import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  VehicleReception,
  VehicleReceptionCreate,
  EnhancedVehicleReceptionCreate,
  VehicleReceptionUpdate,
  VehicleReceptionList,
  User,
  LoginCredentials,
  RegisterData,
  AuthToken,
  ReportRequest,
  ReportSummary,
  FilterOptions,
  PaginationOptions,
  FinancialReportRequest,
  FinancialReportSummary,
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_V1_STR = process.env.REACT_APP_API_URL?.includes('/api/v1') ? '' : '/api/v1';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}${API_V1_STR}`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle auth errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Vehicle Reception endpoints
  async getVehicleReceptions(
    pagination: PaginationOptions,
    filters: FilterOptions = {}
  ): Promise<VehicleReceptionList> {
    const params: any = {
      page: pagination.page,
      size: pagination.size,
      sort_by: filters.sort_by || 'created_at',
      sort_order: filters.sort_order || 'desc',
    };
    
    // Only add filter parameters if they have valid values
    if (filters.company_filter && filters.company_filter.trim() !== '') {
      params.company_filter = filters.company_filter;
    }
    if (filters.water_type_filter && filters.water_type_filter.trim() !== '') {
      params.water_type_filter = filters.water_type_filter;
    }
    if (filters.date_from && filters.date_from.trim() !== '') {
      params.date_from = filters.date_from;
    }
    if (filters.date_to && filters.date_to.trim() !== '') {
      params.date_to = filters.date_to;
    }
    
    const response: AxiosResponse<VehicleReceptionList> = await this.api.get(
      '/vehicle-receptions/',
      { params }
    );
    return response.data;
  }

  async getVehicleReception(id: number): Promise<VehicleReception> {
    const response: AxiosResponse<VehicleReception> = await this.api.get(
      `/vehicle-receptions/${id}`
    );
    return response.data;
  }

  createVehicleReception = async (data: VehicleReceptionCreate): Promise<VehicleReception> => {
    const response: AxiosResponse<VehicleReception> = await this.api.post(
      '/vehicle-receptions/',
      data
    );
    return response.data;
  }

  createEnhancedVehicleReception = async (data: EnhancedVehicleReceptionCreate): Promise<VehicleReception> => {
    const response: AxiosResponse<VehicleReception> = await this.api.post(
      '/vehicle-receptions/enhanced',
      data
    );
    return response.data;
  }

  updateVehicleReception = async (
    id: number,
    data: VehicleReceptionUpdate
  ): Promise<VehicleReception> => {
    const response: AxiosResponse<VehicleReception> = await this.api.put(
      `/vehicle-receptions/${id}`,
      data
    );
    return response.data;
  }

  deleteVehicleReception = async (id: number): Promise<void> => {
    await this.api.delete(`/vehicle-receptions/${id}`);
  }

  async getReceptionStats(dateFrom?: string, dateTo?: string): Promise<any> {
    const params: any = {};
    // Only add date parameters if they have valid values
    if (dateFrom && dateFrom.trim() !== '') {
      params.date_from = dateFrom;
    }
    if (dateTo && dateTo.trim() !== '') {
      params.date_to = dateTo;
    }
    
    const response = await this.api.get('/vehicle-receptions/stats/summary', { params });
    return response.data;
  }

  // Authentication endpoints
  async login(credentials: LoginCredentials): Promise<AuthToken> {
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    
    const response: AxiosResponse<AuthToken> = await this.api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  }

  async register(data: RegisterData): Promise<User> {
    const response: AxiosResponse<User> = await this.api.post('/auth/register', data);
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<User> = await this.api.get('/auth/me');
    return response.data;
  }

  // Reports endpoints
  async generateReport(request: ReportRequest): Promise<Blob> {
    const response = await this.api.post('/reports/generate', request, {
      responseType: 'blob',
    });
    return response.data;
  }

  async getReportSummary(
    startDate: string,
    endDate: string,
    companyFilter?: string,
    waterTypeFilter?: string
  ): Promise<ReportSummary> {
    const params: any = {
      start_date: startDate,
      end_date: endDate,
    };
    if (companyFilter && companyFilter.trim() !== '') {
      params.company_filter = companyFilter;
    }
    if (waterTypeFilter && waterTypeFilter.trim() !== '') {
      params.water_type_filter = waterTypeFilter;
    }

    const response: AxiosResponse<ReportSummary> = await this.api.get('/reports/summary', {
      params,
    });
    return response.data;
  }

  // Financial Reports endpoints
  async generateFinancialReport(request: FinancialReportRequest): Promise<Blob> {
    const response = await this.api.post('/reports/financial/generate', request, {
      responseType: 'blob',
    });
    return response.data;
  }

  async getFinancialSummary(
    startDate: string,
    endDate: string,
    companyFilter?: string
  ): Promise<FinancialReportSummary> {
    const params: any = {
      start_date: startDate,
      end_date: endDate,
    };
    if (companyFilter && companyFilter.trim() !== '') {
      params.company_filter = companyFilter;
    }

    const response: AxiosResponse<FinancialReportSummary> = await this.api.get('/reports/financial/summary', {
      params,
    });
    return response.data;
  }

  async getCompanyRates(): Promise<any> {
    const response = await this.api.get('/reports/company-rates');
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<any> {
    const response = await this.api.get('/', {
      baseURL: API_BASE_URL,
    });
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;