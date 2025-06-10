import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import { VehicleReceptionForm } from '../components/VehicleReceptionForm';
import { VehicleReceptionTable } from '../components/VehicleReceptionTable';
import { 
  VehicleReception, 
  VehicleReceptionCreate, 
  VehicleReceptionUpdate,
  FilterOptions,
  PaginationOptions
} from '../types';
import apiService from '../services/api';
import { format } from 'date-fns';
import { 
  PlusIcon, 
  DocumentArrowDownIcon,
  ChartBarIcon,
  TruckIcon,
  BuildingOfficeIcon,
  CubeIcon
} from '@heroicons/react/24/outline';

const Dashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const isRTL = i18n.language === 'ar';
  const [editingReception, setEditingReception] = useState<VehicleReception | null>(null);
  const [viewingReception, setViewingReception] = useState<VehicleReception | null>(null);
  const [pagination, setPagination] = useState<PaginationOptions>({ page: 1, size: 10 });
  const [filters, setFilters] = useState<FilterOptions>({ sort_by: 'created_at', sort_order: 'desc' });

  const queryClient = useQueryClient();

  // Fetch vehicle receptions
  const { data: receptionsData, isLoading, error } = useQuery(
    ['vehicle-receptions', pagination, filters],
    () => apiService.getVehicleReceptions(pagination, filters),
    {
      keepPreviousData: true,
    }
  );

  // Fetch statistics
  const { data: stats } = useQuery(
    ['reception-stats', filters.date_from, filters.date_to],
    () => apiService.getReceptionStats(filters.date_from, filters.date_to),
    {
      enabled: true,
    }
  );

  // Mutations
  const createMutation = useMutation(apiService.createVehicleReception, {
    onSuccess: (data) => {
      console.log('✅ Vehicle reception created successfully:', data);
      queryClient.invalidateQueries(['vehicle-receptions']);
      queryClient.invalidateQueries(['reception-stats']);
      setShowForm(false);
    },
    onError: (error: any) => {
      console.error('❌ Failed to create vehicle reception:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      alert(`Failed to create vehicle reception: ${error.response?.data?.detail || error.message}`);
    },
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: VehicleReceptionUpdate }) =>
      apiService.updateVehicleReception(id, data),
    {
      onSuccess: (data) => {
        console.log('✅ Vehicle reception updated successfully:', data);
        queryClient.invalidateQueries(['vehicle-receptions']);
        queryClient.invalidateQueries(['reception-stats']);
        setEditingReception(null);
      },
      onError: (error: any) => {
        console.error('❌ Failed to update vehicle reception:', error);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
        
        if (error.response?.status === 403) {
          alert('You do not have permission to edit this record. Only super admins or the record creator can edit records.');
        } else {
          alert(`Failed to update vehicle reception: ${error.response?.data?.detail || error.message}`);
        }
      },
    }
  );

  const deleteMutation = useMutation(apiService.deleteVehicleReception, {
    onSuccess: () => {
      console.log('✅ Vehicle reception deleted successfully');
      queryClient.invalidateQueries(['vehicle-receptions']);
      queryClient.invalidateQueries(['reception-stats']);
    },
    onError: (error: any) => {
      console.error('❌ Failed to delete vehicle reception:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      if (error.response?.status === 403) {
        alert('You do not have permission to delete this record. Only super admins or the record creator can delete records.');
      } else {
        alert(`Failed to delete vehicle reception: ${error.response?.data?.detail || error.message}`);
      }
    },
  });


  // Event handlers
  const handleCreate = useCallback((data: VehicleReceptionCreate) => {
    console.log('🚀 Attempting to create vehicle reception with data:', data);
    createMutation.mutate(data);
  }, [createMutation]);

  const handleUpdate = useCallback((data: VehicleReceptionCreate) => {
    if (editingReception) {
      // Convert VehicleReceptionCreate to VehicleReceptionUpdate for the API
      const updateData: VehicleReceptionUpdate = { ...data };
      updateMutation.mutate({ id: editingReception.id, data: updateData });
    }
  }, [editingReception, updateMutation]);

  const handleFormSubmit = useCallback((data: VehicleReceptionCreate) => {
    if (editingReception) {
      handleUpdate(data);
    } else {
      handleCreate(data);
    }
  }, [editingReception, handleCreate, handleUpdate]);

  const handleDelete = useCallback((id: number) => {
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const handleSizeChange = useCallback((size: number) => {
    setPagination(prev => ({ ...prev, size, page: 1 }));
  }, []);

  const handleFilterChange = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handleSortChange = useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
    setFilters(prev => ({ ...prev, sort_by: sortBy, sort_order: sortOrder }));
  }, []);

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


  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Data</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>Failed to load vehicle receptions. Please try again.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center mb-2">
            {/* <img src="/logo-petro.png" alt="P.P.E.S." className="h-8 w-8 mr-3" /> */}
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              {t('dashboard.title')}
            </h2>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {t('dashboard.subtitle')}
          </p>
        </div>
        {/* <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Add Reception
          </button>
        </div> */}
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className={`w-0 flex-1 ${isRTL ? 'mr-5' : 'ml-5'}`}>
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{t('dashboard.totalReceptions')}</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.total_receptions}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TruckIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className={`w-0 flex-1 ${isRTL ? 'mr-5' : 'ml-5'}`}>
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{t('dashboard.totalVehicles')}</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.total_vehicles}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CubeIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className={`w-0 flex-1 ${isRTL ? 'mr-5' : 'ml-5'}`}>
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{t('dashboard.totalQuantity')}</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.total_quantity.toFixed(2)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BuildingOfficeIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className={`w-0 flex-1 ${isRTL ? 'mr-5' : 'ml-5'}`}>
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{t('dashboard.companies')}</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.companies.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <div 
          className="mb-4" 
          style={{ 
            display: 'flex', 
            justifyContent: isRTL ? 'flex-end' : 'flex-start',
            textAlign: isRTL ? 'right' : 'left'
          }}
        >
          <h3 className="text-lg font-medium text-gray-900">{t('dashboard.quickActions')}</h3>
        </div>
        <div 
          className="flex gap-3" 
          style={{ 
            justifyContent: isRTL ? 'flex-end' : 'flex-start',
            flexDirection: isRTL ? 'row-reverse' : 'row'
          }}
        >
          <a
            href="/enhanced-reception"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className={`h-5 w-5 ${isRTL ? 'ml-2 -mr-1' : '-ml-1 mr-2'}`} />
            {t('dashboard.addReception')}
          </a>
          <a
            href="/reports"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <DocumentArrowDownIcon className={`h-5 w-5 ${isRTL ? 'ml-2 -mr-1' : '-ml-1 mr-2'}`} />
            {t('dashboard.generateReports')}
          </a>
        </div>
      </div>

      {/* Form Modal */}
      {(showForm || editingReception) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <VehicleReceptionForm
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingReception(null);
              }}
              initialData={editingReception || undefined}
              isLoading={createMutation.isLoading || updateMutation.isLoading}
            />
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingReception && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">{t('table.receptionDetails', 'Vehicle Reception Details')}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-500">{t('table.date')}:</span>
                  <p className="text-gray-900">{format(new Date(viewingReception.date), 'PPP')}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-500">{t('table.day')}:</span>
                  <p className="text-gray-900">{translateDayName(viewingReception.day_of_week)}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-500">{t('table.company')}:</span>
                  <p className="text-gray-900">{viewingReception.company_name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-500">{t('table.vehicles')}:</span>
                  <p className="text-gray-900">{viewingReception.number_of_vehicles}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-500">{t('table.waterType')}:</span>
                  <p className="text-gray-900">{translateWaterType(viewingReception.water_type)}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-500">{t('table.quantity')}:</span>
                  <p className="text-gray-900">{viewingReception.total_quantity} m³</p>
                </div>
                {viewingReception.arrival_time && (
                  <div>
                    <span className="font-medium text-gray-500">{t('form.arrivalTime')}:</span>
                    <p className="text-gray-900">{format(new Date(viewingReception.arrival_time), 'HH:mm')}</p>
                  </div>
                )}
                {viewingReception.departure_time && (
                  <div>
                    <span className="font-medium text-gray-500">{t('form.departureTime')}:</span>
                    <p className="text-gray-900">{format(new Date(viewingReception.departure_time), 'HH:mm')}</p>
                  </div>
                )}
                {viewingReception.notes && (
                  <div className="col-span-2">
                    <span className="font-medium text-gray-500">{t('form.notes')}:</span>
                    <p className="text-gray-900">{viewingReception.notes}</p>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setViewingReception(null)}
                  className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <VehicleReceptionTable
        data={receptionsData?.items || []}
        total={receptionsData?.total || 0}
        page={receptionsData?.page || 1}
        size={receptionsData?.size || 10}
        pages={receptionsData?.pages || 1}
        filters={filters}
        isLoading={isLoading}
        onEdit={setEditingReception}
        onDelete={handleDelete}
        onView={setViewingReception}
        onPageChange={handlePageChange}
        onSizeChange={handleSizeChange}
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
      />
    </div>
  );
};

export default Dashboard;