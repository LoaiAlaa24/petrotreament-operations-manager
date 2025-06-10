import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { EnhancedVehicleReceptionCreate, VehicleCreate } from '../types';
import { format } from 'date-fns';

interface EnhancedVehicleReceptionFormProps {
  onSubmit: (data: EnhancedVehicleReceptionCreate) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

interface FormData {
  date: string;
  company_name: string;
  water_type: string;
  total_quantity: number;
  arrival_time?: string;
  departure_time?: string;
  exit_time_drilling?: string;
  notes?: string;
  vehicles: VehicleCreate[];
}

export const EnhancedVehicleReceptionForm: React.FC<EnhancedVehicleReceptionFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const [customCompany, setCustomCompany] = useState('');
  const [customWaterType, setCustomWaterType] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formDataToSubmit, setFormDataToSubmit] = useState<EnhancedVehicleReceptionCreate | null>(null);

  // Get translated options
  const companies = t('companies', { returnObjects: true }) as string[];
  const waterTypes = t('waterTypes', { returnObjects: true }) as string[];
  const vehicleTypes = t('vehicleTypes', { returnObjects: true }) as string[];

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
    trigger,
  } = useForm<FormData>({
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      total_quantity: 0,
      vehicles: [
        {
          vehicle_number: '',
          vehicle_type: '',
          driver_name: '',
          car_brand: '',
          vehicle_quantity: 0,
          vehicle_order: 1,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'vehicles',
  });

  const selectedCompany = watch('company_name');
  const selectedWaterType = watch('water_type');
  const watchedVehicles = watch('vehicles');

  const formatDateTime = (date: string, time: string) => {
    if (!date || !time) return undefined;
    return `${date}T${time}:00`;
  };

  const calculateTotalQuantity = () => {
    return watchedVehicles.reduce((total, vehicle) => {
      return total + (parseFloat(vehicle.vehicle_quantity?.toString() || '0') || 0);
    }, 0);
  };

  const addVehicle = () => {
    const newOrder = fields.length + 1;
    append({
      vehicle_number: '',
      vehicle_type: '',
      driver_name: '',
      car_brand: '',
      vehicle_quantity: 0,
      vehicle_order: newOrder,
    });
  };

  const removeVehicle = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const onFormSubmit = async (data: FormData) => {
    // Validate all fields first
    const isValid = await trigger();
    if (!isValid) return;

    // Handle custom company name
    let companyName = data.company_name;
    if (companyName === 'Other' && customCompany) {
      companyName = customCompany;
    }

    // Handle custom water type
    let waterType = data.water_type;
    if (waterType === 'Other' && customWaterType) {
      waterType = customWaterType;
    }

    // Update vehicle orders and calculate total quantity
    const updatedVehicles = data.vehicles.map((vehicle, index) => ({
      ...vehicle,
      vehicle_order: index + 1,
      vehicle_quantity: parseFloat(vehicle.vehicle_quantity?.toString() || '0'),
    }));

    const totalQuantity = updatedVehicles.reduce((sum, v) => sum + v.vehicle_quantity, 0);

    const formattedData: EnhancedVehicleReceptionCreate = {
      ...data,
      company_name: companyName,
      water_type: waterType,
      date: formatDateTime(data.date, '00:00') || `${data.date}T00:00:00`,
      total_quantity: totalQuantity,
      arrival_time: data.arrival_time ? formatDateTime(data.date, data.arrival_time) : undefined,
      departure_time: data.departure_time ? formatDateTime(data.date, data.departure_time) : undefined,
      exit_time_drilling: data.exit_time_drilling ? formatDateTime(data.date, data.exit_time_drilling) : undefined,
      vehicles: updatedVehicles,
    };

    setFormDataToSubmit(formattedData);
    setShowConfirmation(true);
  };

  const confirmSubmission = () => {
    if (formDataToSubmit) {
      onSubmit(formDataToSubmit);
      setShowConfirmation(false);
    }
  };

  const backToEdit = () => {
    setShowConfirmation(false);
    setFormDataToSubmit(null);
  };

  if (showConfirmation && formDataToSubmit) {
    return (
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {t('form.confirmSubmission')}
        </h2>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('form.receptionSummary')}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div><strong>{t('form.date')}:</strong> {format(new Date(formDataToSubmit.date), 'yyyy-MM-dd')}</div>
            <div><strong>{t('form.company')}:</strong> {formDataToSubmit.company_name}</div>
            <div><strong>{t('form.waterType')}:</strong> {formDataToSubmit.water_type}</div>
            <div><strong>{t('form.quantity')}:</strong> {formDataToSubmit.total_quantity.toFixed(2)} m³</div>
            <div><strong>{t('form.totalVehicles')}:</strong> {formDataToSubmit.vehicles.length}</div>
          </div>

          <h4 className="text-md font-medium text-gray-900 mb-3">{t('form.vehiclesList')}:</h4>
          <div className="space-y-3">
            {formDataToSubmit.vehicles.map((vehicle, index) => (
              <div key={index} className="bg-white rounded border p-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div><strong>{t('form.vehicle')} {index + 1}</strong></div>
                  <div><strong>{t('form.vehicleNumber')}:</strong> {vehicle.vehicle_number}</div>
                  <div><strong>{t('form.vehicleType')}:</strong> {vehicle.vehicle_type}</div>
                  <div><strong>{t('form.driverName')}:</strong> {vehicle.driver_name}</div>
                  <div><strong>{t('form.carBrand')}:</strong> {vehicle.car_brand}</div>
                  <div><strong>{t('form.vehicleQuantity')}:</strong> {vehicle.vehicle_quantity.toFixed(2)} m³</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={backToEdit}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {t('common.back')}
          </button>
          <button
            onClick={confirmSubmission}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? t('form.saving') : t('form.create')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        {t('form.addNewEnhanced')}
      </h2>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Reception Details Section */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('form.receptionSummary')}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                {t('form.date')} *
              </label>
              <input
                type="date"
                id="date"
                {...register('date', { required: t('form.dateRequired') })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>

            {/* Company Name */}
            <div>
              <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-1">
                {t('form.company')} *
              </label>
              <select
                id="company_name"
                {...register('company_name', { required: t('form.companyRequired') })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="">{t('form.selectCompany')}</option>
                {companies.map((company: string) => (
                  <option key={company} value={company}>
                    {company}
                  </option>
                ))}
              </select>
              {selectedCompany === 'Other' && (
                <input
                  type="text"
                  placeholder={t('form.customCompany')}
                  value={customCompany}
                  onChange={(e) => setCustomCompany(e.target.value)}
                  className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              )}
              {errors.company_name && (
                <p className="mt-1 text-sm text-red-600">{errors.company_name.message}</p>
              )}
            </div>

            {/* Water Type */}
            <div>
              <label htmlFor="water_type" className="block text-sm font-medium text-gray-700 mb-1">
                {t('form.waterType')} *
              </label>
              <select
                id="water_type"
                {...register('water_type', { required: t('form.waterTypeRequired') })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="">{t('form.selectWaterType')}</option>
                {waterTypes.map((type: string) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {selectedWaterType === 'Other' && (
                <input
                  type="text"
                  placeholder={t('form.customWaterType')}
                  value={customWaterType}
                  onChange={(e) => setCustomWaterType(e.target.value)}
                  className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              )}
              {errors.water_type && (
                <p className="mt-1 text-sm text-red-600">{errors.water_type.message}</p>
              )}
            </div>

            {/* Total Quantity (Auto-calculated) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('form.quantity')} (Auto-calculated)
              </label>
              <div className="block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-700">
                {calculateTotalQuantity().toFixed(2)} m³
              </div>
            </div>

            {/* Arrival Time */}
            <div>
              <label htmlFor="arrival_time" className="block text-sm font-medium text-gray-700 mb-1">
                {t('form.arrivalTime')}
              </label>
              <input
                type="time"
                id="arrival_time"
                {...register('arrival_time')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>

            {/* Departure Time */}
            <div>
              <label htmlFor="departure_time" className="block text-sm font-medium text-gray-700 mb-1">
                {t('form.departureTime')}
              </label>
              <input
                type="time"
                id="departure_time"
                {...register('departure_time')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>

            {/* Exit Time from Drilling */}
            <div className="md:col-span-2">
              <label htmlFor="exit_time_drilling" className="block text-sm font-medium text-gray-700 mb-1">
                {t('form.exitTime')}
              </label>
              <input
                type="time"
                id="exit_time_drilling"
                {...register('exit_time_drilling')}
                className="block w-full md:w-1/2 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                {t('form.notes')}
              </label>
              <textarea
                id="notes"
                rows={3}
                {...register('notes')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder={t('form.notesPlaceholder')}
              />
            </div>
          </div>
        </div>

        {/* Vehicles Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">{t('form.vehicleDetails')}</h3>
            <button
              type="button"
              onClick={addVehicle}
              className="px-3 py-2 text-sm font-medium text-primary-700 bg-primary-100 border border-primary-300 rounded-md hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              + {t('form.addVehicle')}
            </button>
          </div>

          <div className="space-y-6">
            {fields.map((field, index) => (
              <div key={field.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-gray-900">
                    {t('form.vehicle')} {index + 1}
                  </h4>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVehicle(index)}
                      className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      {t('form.removeVehicle')}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Vehicle Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('form.vehicleNumber')} *
                    </label>
                    <input
                      type="text"
                      {...register(`vehicles.${index}.vehicle_number`, {
                        required: t('form.vehicleNumberRequired'),
                      })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      placeholder="123-ABC-456"
                    />
                    {errors.vehicles?.[index]?.vehicle_number && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.vehicles[index]?.vehicle_number?.message}
                      </p>
                    )}
                  </div>

                  {/* Vehicle Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('form.vehicleType')} *
                    </label>
                    <select
                      {...register(`vehicles.${index}.vehicle_type`, {
                        required: t('form.vehicleTypeRequired'),
                      })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    >
                      <option value="">{t('form.selectVehicleType')}</option>
                      {vehicleTypes.map((type: string) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    {errors.vehicles?.[index]?.vehicle_type && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.vehicles[index]?.vehicle_type?.message}
                      </p>
                    )}
                  </div>

                  {/* Driver Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('form.driverName')} *
                    </label>
                    <input
                      type="text"
                      {...register(`vehicles.${index}.driver_name`, {
                        required: t('form.driverNameRequired'),
                      })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                    {errors.vehicles?.[index]?.driver_name && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.vehicles[index]?.driver_name?.message}
                      </p>
                    )}
                  </div>

                  {/* Car Brand */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('form.carBrand')} *
                    </label>
                    <input
                      type="text"
                      {...register(`vehicles.${index}.car_brand`, {
                        required: t('form.carBrandRequired'),
                      })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                    {errors.vehicles?.[index]?.car_brand && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.vehicles[index]?.car_brand?.message}
                      </p>
                    )}
                  </div>

                  {/* Vehicle Quantity */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('form.vehicleQuantity')} *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      {...register(`vehicles.${index}.vehicle_quantity`, {
                        required: t('form.vehicleQuantityRequired'),
                        min: { value: 0, message: t('form.quantityMin') },
                      })}
                      className="block w-full md:w-1/2 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                    {errors.vehicles?.[index]?.vehicle_quantity && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.vehicles[index]?.vehicle_quantity?.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {t('form.cancel')}
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('form.confirmSubmission')}
          </button>
        </div>
      </form>
    </div>
  );
};