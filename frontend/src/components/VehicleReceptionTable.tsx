import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { VehicleReception, FilterOptions, User } from '../types';
import { format, parseISO } from 'date-fns';
import { PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';

interface VehicleReceptionTableProps {
  data: VehicleReception[];
  total: number;
  page: number;
  size: number;
  pages: number;
  filters: FilterOptions;
  isLoading?: boolean;
  onEdit: (reception: VehicleReception) => void;
  onDelete: (id: number) => void;
  onView: (reception: VehicleReception) => void;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
  onFilterChange: (filters: FilterOptions) => void;
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}

export const VehicleReceptionTable: React.FC<VehicleReceptionTableProps> = ({
  data,
  total,
  page,
  size,
  pages,
  filters,
  isLoading = false,
  onEdit,
  onDelete,
  onView,
  onPageChange,
  onSizeChange,
  onFilterChange,
  onSortChange,
}) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  const isRTL = i18n.language === 'ar';

  // Check if user can edit/delete a specific reception
  const canEditOrDelete = (reception: VehicleReception): boolean => {
    if (!user) return false;
    // Super admin can edit/delete anything
    if (user.role === 'super_admin') return true;
    // Admin can only edit/delete their own records
    if (user.role === 'admin') {
      // If created_by is null/undefined (older records), allow admin to edit
      // This handles the case where records were created before the created_by field was added
      if (!reception.created_by) return true;
      return reception.created_by === user.id;
    }
    return false;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return format(parseISO(dateString), 'HH:mm');
    } catch {
      return dateString;
    }
  };

  // Translate water type to current language
  const translateWaterType = (waterType: string) => {
    if (i18n.language !== 'ar') return waterType;
    
    // Get Arabic water types array from translations
    const arabicWaterTypes = t('waterTypes', { returnObjects: true }) as string[];
    
    // Map English water types to Arabic
    const waterTypeMap: { [key: string]: string } = {
      'Contaminated Water': arabicWaterTypes[0] || 'مياه ملوثة',
      'Sludge': arabicWaterTypes[1] || 'حمأة',
      'Industrial Waste': arabicWaterTypes[2] || 'نفايات صناعية',
      'Oil Contaminated Water': arabicWaterTypes[3] || 'مياه ملوثة بالزيت',
      'Chemical Waste': arabicWaterTypes[4] || 'نفايات كيميائية',
      'Other': arabicWaterTypes[5] || 'أخرى'
    };
    
    return waterTypeMap[waterType] || waterType;
  };

  // Translate day name to current language
  const translateDayName = (dayName: string) => {
    // Get the translated day name
    const translatedDay = t(`days.${dayName}`, { defaultValue: dayName });
    return translatedDay;
  };

  const handleSort = (column: string) => {
    const currentOrder = filters.sort_by === column && filters.sort_order === 'asc' ? 'desc' : 'asc';
    onSortChange(column, currentOrder);
  };

  const getSortIcon = (column: string) => {
    if (filters.sort_by === column) {
      return filters.sort_order === 'asc' ? '↑' : '↓';
    }
    return '↕';
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Only select rows that the user can delete
      const deletableRows = data.filter(item => canEditOrDelete(item)).map(item => item.id);
      setSelectedRows(deletableRows);
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedRows(prev => [...prev, id]);
    } else {
      setSelectedRows(prev => prev.filter(rowId => rowId !== id));
    }
  };

  const handleDelete = (id: number) => {
    onDelete(id);
    setShowDeleteModal(null);
    setSelectedRows(prev => prev.filter(rowId => rowId !== id));
  };

  const handleBulkDelete = () => {
    selectedRows.forEach(id => onDelete(id));
    setSelectedRows([]);
  };

  const pageNumbers = useMemo(() => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, page - delta); i <= Math.min(pages - 1, page + delta); i++) {
      range.push(i);
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (page + delta < pages - 1) {
      rangeWithDots.push('...', pages);
    } else {
      rangeWithDots.push(pages);
    }

    return rangeWithDots;
  }, [page, pages]);

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="company-filter" className="block text-sm font-medium text-gray-700 mb-1">
              {t('table.filterCompany')}
            </label>
            <select
              id="company-filter"
              value={filters.company_filter || ''}
              onChange={(e) => onFilterChange({ ...filters, company_filter: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="">{t('table.allCompanies')}</option>
              {(t('companies', { returnObjects: true }) as string[]).map((company: string, index: number) => (
                <option key={index} value={company}>{company}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="water-type-filter" className="block text-sm font-medium text-gray-700 mb-1">
              {t('table.filterWaterType')}
            </label>
            <select
              id="water-type-filter"
              value={filters.water_type_filter || ''}
              onChange={(e) => onFilterChange({ ...filters, water_type_filter: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="">{t('table.allWaterTypes')}</option>
              {(t('waterTypes', { returnObjects: true }) as string[]).map((waterType: string, index: number) => (
                <option key={index} value={waterType}>{waterType}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="date-from" className="block text-sm font-medium text-gray-700 mb-1">
              {t('table.dateFrom')}
            </label>
            <input
              type="date"
              id="date-from"
              value={filters.date_from || ''}
              onChange={(e) => onFilterChange({ ...filters, date_from: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="date-to" className="block text-sm font-medium text-gray-700 mb-1">
              {t('table.dateTo')}
            </label>
            <input
              type="date"
              id="date-to"
              value={filters.date_to || ''}
              onChange={(e) => onFilterChange({ ...filters, date_to: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedRows.length > 0 && (
        <div className="p-4 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedRows.length} {t('table.results')} {t('table.selected', 'selected')}
            </span>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              {t('table.delete')} {t('table.selected', 'Selected')}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                {data.some(item => canEditOrDelete(item)) ? (
                  <input
                    type="checkbox"
                    checked={selectedRows.length === data.filter(item => canEditOrDelete(item)).length && data.filter(item => canEditOrDelete(item)).length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                ) : (
                  <div className="w-4 h-4"></div>
                )}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('date')}
              >
                {t('table.date')} {getSortIcon('date')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('table.day')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('company_name')}
              >
                {t('table.company')} {getSortIcon('company_name')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('table.vehicles')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('table.waterType')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('total_quantity')}
              >
                {t('table.quantity')} {getSortIcon('total_quantity')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('table.times', 'Times')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('table.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((reception) => (
              <tr key={reception.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  {canEditOrDelete(reception) ? (
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(reception.id)}
                      onChange={(e) => handleSelectRow(reception.id, e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  ) : (
                    <div className="w-4 h-4"></div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(reception.date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {translateDayName(reception.day_of_week)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {reception.company_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {reception.number_of_vehicles}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {translateWaterType(reception.water_type)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {reception.total_quantity.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="space-y-1">
                    <div>{t('table.arrival')}: {formatTime(reception.arrival_time)}</div>
                    <div>{t('table.departure')}: {formatTime(reception.departure_time)}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onView(reception)}
                      className="text-gray-600 hover:text-gray-900"
                      title={t('table.view')}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    {canEditOrDelete(reception) && (
                      <>
                        <button
                          onClick={() => onEdit(reception)}
                          className="text-primary-600 hover:text-primary-900"
                          title={t('table.edit')}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteModal(reception.id)}
                          className="text-red-600 hover:text-red-900"
                          title={t('table.delete')}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {data.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">{t('table.noData')}</p>
          <p className="text-gray-400 text-sm mt-2">{t('table.noDataMessage', 'Try adjusting your filters or add a new reception.')}</p>
        </div>
      )}

      {/* Pagination */}
      {data.length > 0 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('table.previous')}
            </button>
            <button
              onClick={() => onPageChange(Math.min(pages, page + 1))}
              disabled={page === pages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('table.next')}
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4">
              <p className="text-sm text-gray-700">
                {t('table.showing')}{' '}
                <span className="font-medium">{Math.min((page - 1) * size + 1, total)}</span>
                {' '}{t('table.to')}{' '}
                <span className="font-medium">{Math.min(page * size, total)}</span>
                {' '}{t('table.of')}{' '}
                <span className="font-medium">{total}</span>
                {' '}{t('table.results')}
              </p>
              <div className="flex items-center space-x-2">
                <label htmlFor="page-size" className="text-sm text-gray-700">
                  {t('table.itemsPerPage')}:
                </label>
                <select
                  id="page-size"
                  value={size}
                  onChange={(e) => onSizeChange(Number(e.target.value))}
                  className="rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => onPageChange(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {pageNumbers.map((pageNum, idx) => (
                  <button
                    key={idx}
                    onClick={() => typeof pageNum === 'number' && onPageChange(pageNum)}
                    disabled={pageNum === '...'}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      pageNum === page
                        ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                        : pageNum === '...'
                        ? 'border-gray-300 bg-white text-gray-500 cursor-default'
                        : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  onClick={() => onPageChange(Math.min(pages, page + 1))}
                  disabled={page === pages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">{t('common.confirm')} {t('table.delete')}</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  {t('table.confirmDelete')}
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => handleDelete(showDeleteModal)}
                  className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-24 mr-2 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  {t('table.delete')}
                </button>
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-24 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};