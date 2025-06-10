import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { VehicleReceptionCreate, VehicleReception } from '../types';
import { format } from 'date-fns';

interface VehicleReceptionFormProps {
  onSubmit: (data: VehicleReceptionCreate) => void;
  onCancel: () => void;
  initialData?: VehicleReception;
  isLoading?: boolean;
}



export const VehicleReceptionForm: React.FC<VehicleReceptionFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const [customCompany, setCustomCompany] = useState('');
  const [customWaterType, setCustomWaterType] = useState('');

  // Get translated options
  const companies = t('companies', { returnObjects: true }) as string[];
  const waterTypes = t('waterTypes', { returnObjects: true }) as string[];

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<VehicleReceptionCreate>({
    defaultValues: initialData ? {
      date: format(new Date(initialData.date), 'yyyy-MM-dd'),
      invoice_number: initialData.invoice_number || '',
      company_name: initialData.company_name,
      number_of_vehicles: initialData.number_of_vehicles,
      water_type: initialData.water_type,
      total_quantity: initialData.total_quantity,
      arrival_time: initialData.arrival_time ? format(new Date(initialData.arrival_time), 'HH:mm') : '',
      departure_time: initialData.departure_time ? format(new Date(initialData.departure_time), 'HH:mm') : '',
      notes: initialData.notes || '',
    } : {
      date: format(new Date(), 'yyyy-MM-dd'),
      number_of_vehicles: 1,
      total_quantity: 0,
    },
  });

  const selectedCompany = watch('company_name');
  const selectedWaterType = watch('water_type');

  const formatDateTime = (date: string, time: string) => {
    if (!date || !time) return undefined;
    return `${date}T${time}:00`;
  };

  const onFormSubmit = (data: any) => {
    console.log('📝 Form submitted with raw data:', data);
    
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

    const formattedData = {
      ...data,
      company_name: companyName,
      water_type: waterType,
      date: formatDateTime(data.date, '00:00') || `${data.date}T00:00:00`, // Send as datetime with midnight time
      number_of_vehicles: parseInt(data.number_of_vehicles, 10),
      total_quantity: parseFloat(data.total_quantity),
      arrival_time: data.arrival_time ? formatDateTime(data.date, data.arrival_time) : undefined,
      departure_time: data.departure_time ? formatDateTime(data.date, data.departure_time) : undefined,
    };

    console.log('✨ Formatted data being sent:', formattedData);
    onSubmit(formattedData);
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        {initialData ? t('form.edit') : t('form.addNew')}
      </h2>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
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

          {/* Invoice Number */}
          <div>
            <label htmlFor="invoice_number" className="block text-sm font-medium text-gray-700 mb-1">
              {t('form.invoiceNumber')}
            </label>
            <input
              type="text"
              id="invoice_number"
              {...register('invoice_number')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder={t('form.invoiceNumberPlaceholder')}
            />
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

          {/* Number of Vehicles */}
          <div>
            <label htmlFor="number_of_vehicles" className="block text-sm font-medium text-gray-700 mb-1">
              {t('form.vehicles')} *
            </label>
            <input
              type="number"
              id="number_of_vehicles"
              min="1"
              {...register('number_of_vehicles', {
                required: t('form.vehiclesRequired'),
                min: { value: 1, message: t('form.vehiclesMin') },
              })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
            {errors.number_of_vehicles && (
              <p className="mt-1 text-sm text-red-600">{errors.number_of_vehicles.message}</p>
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

          {/* Total Quantity */}
          <div>
            <label htmlFor="total_quantity" className="block text-sm font-medium text-gray-700 mb-1">
              {t('form.quantity')} *
            </label>
            <input
              type="number"
              id="total_quantity"
              min="0"
              step="0.01"
              {...register('total_quantity', {
                required: t('form.quantityRequired'),
                min: { value: 0, message: t('form.quantityMin') },
              })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
            {errors.total_quantity && (
              <p className="mt-1 text-sm text-red-600">{errors.total_quantity.message}</p>
            )}
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
            {isLoading ? t('form.saving') : initialData ? t('form.update') : t('form.create')}
          </button>
        </div>
      </form>
    </div>
  );
};