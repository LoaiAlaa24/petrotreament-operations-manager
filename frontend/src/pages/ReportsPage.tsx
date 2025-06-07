import React, { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import { useTranslation } from 'react-i18next';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { 
  DocumentArrowDownIcon,
  CalendarDaysIcon,
  BuildingOfficeIcon,
  CubeIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { ReportRequest, FinancialReportRequest } from '../types';
import apiService from '../services/api';
import { useAuth } from '../hooks/useAuth';

const ReportsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isRTL = i18n.language === 'ar';
  
  // Check if user is super admin
  const isSuperAdmin = user?.role === 'super_admin';
  const [reportForm, setReportForm] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    reportType: 'monthly' as 'daily' | 'weekly' | 'monthly',
    companyFilter: '',
    waterTypeFilter: '',
  });

  const [financialForm, setFinancialForm] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    companyFilter: '',
  });

  // Predefined date ranges
  const quickRanges = [
    {
      label: t('reports.today'),
      getValue: () => ({
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
        reportType: 'daily' as const
      })
    },
    {
      label: t('reports.thisWeek'),
      getValue: () => ({
        startDate: format(startOfWeek(new Date()), 'yyyy-MM-dd'),
        endDate: format(endOfWeek(new Date()), 'yyyy-MM-dd'),
        reportType: 'weekly' as const
      })
    },
    {
      label: t('reports.thisMonth'),
      getValue: () => ({
        startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
        reportType: 'monthly' as const
      })
    },
    {
      label: t('reports.last7Days'),
      getValue: () => ({
        startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
        reportType: 'weekly' as const
      })
    },
    {
      label: t('reports.last30Days'),
      getValue: () => ({
        startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
        reportType: 'monthly' as const
      })
    }
  ];

  // Fetch report summary
  const { data: summary, isLoading: summaryLoading, error: summaryError } = useQuery(
    ['report-summary', reportForm.startDate, reportForm.endDate, reportForm.companyFilter, reportForm.waterTypeFilter],
    () => apiService.getReportSummary(
      reportForm.startDate,
      reportForm.endDate,
      reportForm.companyFilter || undefined,
      reportForm.waterTypeFilter || undefined
    ),
    {
      enabled: !!(reportForm.startDate && reportForm.endDate),
      retry: 1,
      onError: (error) => {
        console.error('Report summary fetch error:', error);
      }
    }
  );

  // Fetch financial summary (only for super admin)
  const { data: financialSummary, isLoading: financialLoading, error: financialError } = useQuery(
    ['financial-summary', financialForm.startDate, financialForm.endDate, financialForm.companyFilter],
    () => apiService.getFinancialSummary(
      financialForm.startDate,
      financialForm.endDate,
      financialForm.companyFilter || undefined
    ),
    {
      enabled: !!(financialForm.startDate && financialForm.endDate && isSuperAdmin),
      retry: 1,
      onError: (error) => {
        console.error('Financial summary fetch error:', error);
      }
    }
  );

  // Generate PDF mutation
  const generateReportMutation = useMutation((request: ReportRequest) => apiService.generateReport(request), {
    onSuccess: (blob) => {
      console.log('PDF blob received:', blob);
      if (!blob || blob.size === 0) {
        console.error('Empty blob received');
        alert('Failed to generate report: Empty response received.');
        return;
      }
      
      try {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `petrotreatment_report_${reportForm.reportType}_${reportForm.startDate}_${reportForm.endDate}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        console.log('PDF download initiated successfully');
      } catch (err) {
        console.error('Error creating download link:', err);
        alert('Failed to download report. Please try again.');
      }
    },
    onError: (error: any) => {
      console.error('Report generation failed:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      alert(`Failed to generate report: ${error.message || 'Unknown error'}. Please try again.`);
    }
  });

  // Generate Financial PDF mutation
  const generateFinancialReportMutation = useMutation((request: FinancialReportRequest) => apiService.generateFinancialReport(request), {
    onSuccess: (blob) => {
      console.log('Financial PDF blob received:', blob);
      if (!blob || blob.size === 0) {
        console.error('Empty blob received');
        alert('Failed to generate financial report: Empty response received.');
        return;
      }
      
      try {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `financial_report_${financialForm.startDate}_${financialForm.endDate}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        console.log('Financial PDF download initiated successfully');
      } catch (err) {
        console.error('Error creating financial download link:', err);
        alert('Failed to download financial report. Please try again.');
      }
    },
    onError: (error: any) => {
      console.error('Financial report generation failed:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      alert(`Failed to generate financial report: ${error.message || 'Unknown error'}. Please try again.`);
    }
  });

  const handleQuickRange = (range: typeof quickRanges[0]) => {
    const values = range.getValue();
    setReportForm(prev => ({
      ...prev,
      ...values
    }));
    // Sync financial form dates
    setFinancialForm(prev => ({
      ...prev,
      startDate: values.startDate,
      endDate: values.endDate
    }));
  };

  const handleGenerateReport = () => {
    const request: ReportRequest = {
      start_date: reportForm.startDate,
      end_date: reportForm.endDate,
      report_type: reportForm.reportType,
      company_filter: reportForm.companyFilter || undefined,
      water_type_filter: reportForm.waterTypeFilter || undefined,
    };

    generateReportMutation.mutate(request);
  };

  const handleGenerateFinancialReport = () => {
    const request: FinancialReportRequest = {
      start_date: financialForm.startDate,
      end_date: financialForm.endDate,
      company_filter: financialForm.companyFilter || undefined,
    };

    generateFinancialReportMutation.mutate(request);
  };

  const companies = t('companies', { returnObjects: true }) as string[];
  const waterTypes = t('waterTypes', { returnObjects: true }) as string[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center mb-2">
            {/* <img src="/logo-petro.png" alt="P.P.E.S." className="h-8 w-8 mr-3" /> */}
            <h1 className="text-2xl font-bold text-gray-900">{t('reports.title')}</h1>
          </div>
          <p className="text-gray-600">{t('reports.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Unified Report Configuration */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">{t('reports.configuration')}</h2>
            
            {/* Quick Date Ranges */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('reports.quickRanges')}</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {quickRanges.map((range) => (
                  <button
                    key={range.label}
                    onClick={() => handleQuickRange(range)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('reports.startDate')}
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={reportForm.startDate}
                  onChange={(e) => {
                    setReportForm(prev => ({ ...prev, startDate: e.target.value }));
                    setFinancialForm(prev => ({ ...prev, startDate: e.target.value }));
                  }}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('reports.endDate')}
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={reportForm.endDate}
                  onChange={(e) => {
                    setReportForm(prev => ({ ...prev, endDate: e.target.value }));
                    setFinancialForm(prev => ({ ...prev, endDate: e.target.value }));
                  }}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Report Type */}
            <div className="mb-6">
              <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 mb-1">
                {t('reports.reportType')}
              </label>
              <select
                id="reportType"
                value={reportForm.reportType}
                onChange={(e) => setReportForm(prev => ({ ...prev, reportType: e.target.value as any }))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="daily">{t('reports.daily')}</option>
                <option value="weekly">{t('reports.weekly')}</option>
                <option value="monthly">{t('reports.monthly')}</option>
              </select>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="companyFilter" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('reports.filterCompany')}
                </label>
                <select
                  id="companyFilter"
                  value={reportForm.companyFilter}
                  onChange={(e) => {
                    setReportForm(prev => ({ ...prev, companyFilter: e.target.value }));
                    setFinancialForm(prev => ({ ...prev, companyFilter: e.target.value }));
                  }}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="">{t('table.allCompanies')}</option>
                  {companies.map((company) => (
                    <option key={company} value={company}>{company}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="waterTypeFilter" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('reports.filterWaterType')}
                </label>
                <select
                  id="waterTypeFilter"
                  value={reportForm.waterTypeFilter}
                  onChange={(e) => setReportForm(prev => ({ ...prev, waterTypeFilter: e.target.value }))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="">{t('table.allWaterTypes')}</option>
                  {waterTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>


            {/* Generate Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleGenerateReport}
                disabled={generateReportMutation.isLoading || !reportForm.startDate || !reportForm.endDate}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <DocumentArrowDownIcon className="-ml-1 mr-2 h-5 w-5" />
                {generateReportMutation.isLoading ? t('reports.generating') : t('reports.generatePDF')}
              </button>
              {/* Financial PDF button - only visible to super admin */}
              {isSuperAdmin && (
                <button
                  onClick={handleGenerateFinancialReport}
                  disabled={generateFinancialReportMutation.isLoading || !financialForm.startDate || !financialForm.endDate}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <DocumentArrowDownIcon className="-ml-1 mr-2 h-5 w-5" />
                  {generateFinancialReportMutation.isLoading ? t('reports.generating') : t('reports.generateFinancialPDF')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="space-y-6">
          {(summaryLoading || (isSuperAdmin && financialLoading)) ? (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="space-y-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          ) : (summaryError || (isSuperAdmin && financialError)) ? (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-center text-red-600">
                <p>{t('reports.errorLoading')}</p>
                <p className="text-sm text-gray-500 mt-2">{t('reports.checkDateRange')}</p>
              </div>
            </div>
          ) : (summary && summary.period) || (isSuperAdmin && financialSummary) ? (
            <>
              {/* Combined Summary */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <CalendarDaysIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">{t('reports.periodSummary')}</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">{t('reports.period')}:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {summary?.period ? 
                        `${format(new Date(summary.period.start_date), 'yyyy-MM-dd')} to ${format(new Date(summary.period.end_date), 'yyyy-MM-dd')} (${summary.period.days} days)` : 
                        (isSuperAdmin && financialSummary) ? 
                          `${format(new Date(financialSummary.period_start), 'yyyy-MM-dd')} to ${format(new Date(financialSummary.period_end), 'yyyy-MM-dd')}` : 
                          '0 days'
                      }
                    </span>
                  </div>
                  {summary && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">{t('dashboard.totalReceptions')}:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {summary.totals?.receptions || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">{t('dashboard.totalVehicles')}:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {summary.totals?.vehicles || 0}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">{t('dashboard.totalQuantity')}:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {(summary?.totals?.quantity || (isSuperAdmin && financialSummary?.total_volume_m3) || 0).toFixed(2)} m³
                    </span>
                  </div>
                  {isSuperAdmin && financialSummary && (
                    <div className="flex justify-between border-t pt-3">
                      <span className="text-sm text-gray-500">{t('reports.totalCost')}:</span>
                      <span className="text-sm font-medium text-green-600">
                        ${financialSummary.total_cost.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Daily Averages */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <ChartBarIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">{t('reports.dailyAverages')}</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">{t('reports.vehiclesPerDay')}:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {summary?.averages?.vehicles_per_day || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">{t('reports.quantityPerDay')}:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {summary?.averages?.quantity_per_day || 0} m³
                    </span>
                  </div>
                </div>
              </div>

              {/* Company Breakdown */}
              {(summary?.breakdowns?.companies && Object.keys(summary.breakdowns.companies).length > 0) || 
               (isSuperAdmin && financialSummary?.companies && financialSummary.companies.length > 0) ? (
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900">{t('reports.byCompany')}</h3>
                  </div>
                  <div className="space-y-3">
                    {isSuperAdmin && financialSummary?.companies ? (
                      // Show financial breakdown
                      financialSummary.companies.slice(0, 5).map((company, index) => (
                        <div key={index} className="border-l-4 border-green-400 pl-3">
                          <div className="text-sm font-medium text-gray-900">{company.company_name}</div>
                          <div className="text-xs text-gray-500">
                            {company.reception_count} {t('reports.receptions')} • {company.total_volume_m3.toFixed(1)} m³ • 
                            <span className="text-green-600 font-medium"> ${company.total_cost.toFixed(2)}</span>
                          </div>
                        </div>
                      ))
                    ) : summary?.breakdowns?.companies ? (
                      // Show operational breakdown
                      Object.entries(summary.breakdowns.companies).map(([company, data]: [string, any]) => (
                        <div key={company} className="border-l-4 border-primary-400 pl-3">
                          <div className="text-sm font-medium text-gray-900">{company}</div>
                          <div className="text-xs text-gray-500">
                            {data.receptions} {t('reports.receptions')} • {data.vehicles} {t('reports.vehicles')} • {data.quantity.toFixed(1)} m³
                          </div>
                        </div>
                      ))
                    ) : null}
                  </div>
                </div>
              ) : null}

              {/* Water Type Breakdown */}
              {summary?.breakdowns?.water_types && Object.keys(summary.breakdowns.water_types).length > 0 && (
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <CubeIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900">{t('reports.byWaterType')}</h3>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(summary?.breakdowns?.water_types || {}).map(([type, data]: [string, any]) => (
                      <div key={type} className="border-l-4 border-green-400 pl-3">
                        <div className="text-sm font-medium text-gray-900">{type}</div>
                        <div className="text-xs text-gray-500">
                          {data.receptions} {t('reports.receptions')} • {data.vehicles} {t('reports.vehicles')} • {data.quantity.toFixed(1)} m³
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;