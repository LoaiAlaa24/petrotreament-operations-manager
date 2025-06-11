import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { EnhancedVehicleReceptionCreate } from '../types';
import { format } from 'date-fns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { TextField } from '@mui/material';
import { arEG } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
// import apiService from '../services/api'; // Temporarily disabled

interface EnhancedVehicleReceptionFormProps {
  onSubmit: (data: EnhancedVehicleReceptionCreate) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

interface VehicleFormData {
  tractor_number: string;
  trailer_number: string;
  vehicle_type: string;
  driver_name: string;
  car_brand: string;
  vehicle_quantity: number;
  vehicle_order: number;
}

interface FormData {
  date: string;
  invoice_number?: string;
  company_name: string;
  water_type: string;
  total_quantity: number;
  arrival_time?: string;
  departure_time?: string;
  notes?: string;
  cutting_boxes_amount?: number | string; // Can be string from form input
  vehicles: VehicleFormData[];
}


export const EnhancedVehicleReceptionForm: React.FC<EnhancedVehicleReceptionFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const isRTL = currentLanguage === 'ar';
  const dateLocale = isRTL ? arEG : enUS;
  const [customCompany, setCustomCompany] = useState('');
  const [customWaterType, setCustomWaterType] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formDataToSubmit, setFormDataToSubmit] = useState<EnhancedVehicleReceptionCreate | null>(null);
  // const [vehicleOptions, setVehicleOptions] = useState<VehicleOption[]>([]);  // Temporarily disabled
  // const [loadingVehicles, setLoadingVehicles] = useState(true);  // Temporarily disabled

  // Get translated options
  const companies = t('companies', { returnObjects: true }) as string[];
  const waterTypes = t('waterTypes', { returnObjects: true }) as string[];
  const vehicleTypes = t('vehicleTypes', { returnObjects: true }) as string[];

  // Temporarily disabled - Load vehicle options from API
  useEffect(() => {
    // const loadVehicleOptions = async () => {
    //   try {
    //     const options = await apiService.getVehicleOptions();
    //     setVehicleOptions(options);
    //   } catch (error) {
    //     console.error('Failed to load vehicle options:', error);
    //     // Fallback to empty array or show error message
    //     setVehicleOptions([]);
    //   } finally {
    //     setLoadingVehicles(false);
    //   }
    // };

    // loadVehicleOptions();
    
    // Temporarily set loading to false to skip vehicle selection
    // setLoadingVehicles(false);
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
    trigger,
    // setValue,  // Temporarily disabled
  } = useForm<FormData>({
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      total_quantity: 0,
      vehicles: [
        {
          tractor_number: '',
          trailer_number: '',
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
  const arrivalTime = watch('arrival_time');
  const departureTime = watch('departure_time');

  const formatDateTime = (date: string, time: string) => {
    if (!date || !time) return undefined;
    return `${date}T${time}:00`;
  };

  const calculateTotalQuantity = () => {
    return watchedVehicles.reduce((total, vehicle) => {
      return total + (parseFloat(vehicle.vehicle_quantity?.toString() || '0') || 0);
    }, 0);
  };

  // Time validation function
  const validateTimes = () => {
    if (!arrivalTime || !departureTime) return true; // Allow empty times
    
    try {
      // Convert time strings to Date objects for comparison
      const today = new Date().toISOString().split('T')[0]; // Get today's date
      const arrivalDateTime = new Date(`${today}T${arrivalTime}:00`);
      const departureDateTime = new Date(`${today}T${departureTime}:00`);
      
      // Check if dates are valid
      if (isNaN(arrivalDateTime.getTime()) || isNaN(departureDateTime.getTime())) {
        return true; // If invalid dates, let the field validation handle it
      }
      
      return arrivalDateTime < departureDateTime;
    } catch (error) {
      return true; // If any error occurs, allow the value (let other validation handle it)
    }
  };

  // Effect to re-validate times when either changes
  useEffect(() => {
    if (arrivalTime || departureTime) {
      trigger(['arrival_time', 'departure_time']);
    }
  }, [arrivalTime, departureTime, trigger]);

  const addVehicle = () => {
    const newOrder = fields.length + 1;
    append({
      tractor_number: '',
      trailer_number: '',
      vehicle_type: '',
      driver_name: '',
      car_brand: '',
      vehicle_quantity: 0,
      vehicle_order: newOrder,
    });
  };

  // Handle vehicle selection - Temporarily disabled
  // const handleVehicleSelection = (index: number, selectedVehicleId: string) => {
  //   const vehicleId = selectedVehicleId === '' ? null : parseInt(selectedVehicleId);
  //   const selectedVehicle = vehicleOptions.find(v => v.id === vehicleId);
  //   
  //   if (selectedVehicle) {
  //     const isCustom = selectedVehicle.is_custom;
  //     
  //     // Update form values using setValue
  //     setValue(`vehicles.${index}.selected_vehicle_id`, vehicleId);
  //     setValue(`vehicles.${index}.is_custom_vehicle`, isCustom);
  //     setValue(`vehicles.${index}.vehicle_type`, selectedVehicle.vehicle_type);
  //     setValue(`vehicles.${index}.car_brand`, selectedVehicle.brand || '');
  //     
  //     if (!isCustom && selectedVehicle.current_plate_number) {
  //       // Auto-fill plate number for Petrotreatment vehicles
  //       setValue(`vehicles.${index}.tractor_number`, selectedVehicle.current_plate_number);
  //       setValue(`vehicles.${index}.trailer_number`, ''); // Clear trailer number for user to fill
  //     } else if (isCustom) {
  //       // Clear fields for custom vehicles
  //       setValue(`vehicles.${index}.tractor_number`, '');
  //       setValue(`vehicles.${index}.trailer_number`, '');
  //       setValue(`vehicles.${index}.vehicle_type`, '');
  //       setValue(`vehicles.${index}.car_brand`, '');
  //     }
  //     
  //     // Clear driver name as it's always required to be entered manually
  //     setValue(`vehicles.${index}.driver_name`, '');
  //     
  //     // Trigger validation
  //     trigger(`vehicles.${index}`);
  //   } else {
  //     // Clear selection
  //     setValue(`vehicles.${index}.selected_vehicle_id`, null);
  //     setValue(`vehicles.${index}.is_custom_vehicle`, false);
  //     setValue(`vehicles.${index}.tractor_number`, '');
  //     setValue(`vehicles.${index}.trailer_number`, '');
  //     setValue(`vehicles.${index}.vehicle_type`, '');
  //     setValue(`vehicles.${index}.car_brand`, '');
  //     setValue(`vehicles.${index}.driver_name`, '');
  //   }
  // };

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
      vehicle_number: `${vehicle.tractor_number}-${vehicle.trailer_number}`,
      vehicle_type: vehicle.vehicle_type,
      driver_name: vehicle.driver_name,
      car_brand: vehicle.car_brand,
      vehicle_order: index + 1,
      vehicle_quantity: parseFloat(vehicle.vehicle_quantity?.toString() || '0'),
    }));

    const totalQuantity = updatedVehicles.reduce((sum, v) => sum + v.vehicle_quantity, 0);

    const formattedData: EnhancedVehicleReceptionCreate = {
      date: formatDateTime(data.date, '00:00') || `${data.date}T00:00:00`,
      company_name: companyName,
      water_type: waterType,
      total_quantity: totalQuantity,
      arrival_time: data.arrival_time ? formatDateTime(data.date, data.arrival_time) : undefined,
      departure_time: data.departure_time ? formatDateTime(data.date, data.departure_time) : undefined,
      notes: data.notes && data.notes.trim() !== '' ? data.notes : undefined,
      invoice_number: data.invoice_number && data.invoice_number.trim() !== '' ? data.invoice_number : undefined,
      cutting_boxes_amount: (() => {
        const value = data.cutting_boxes_amount;
        if (value === undefined || value === null) {
          return undefined;
        }
        if (typeof value === 'string') {
          if (value.trim() === '') return undefined;
          const numValue = parseFloat(value);
          return isNaN(numValue) ? undefined : numValue;
        }
        return typeof value === 'number' && !isNaN(value) ? value : undefined;
      })(),
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
            {formDataToSubmit.invoice_number && (
              <div><strong>{t('form.invoiceNumber')}:</strong> {formDataToSubmit.invoice_number}</div>
            )}
            <div><strong>{t('form.company')}:</strong> {formDataToSubmit.company_name}</div>
            <div><strong>{t('form.waterType')}:</strong> {formDataToSubmit.water_type}</div>
            <div><strong>{t('form.quantity')}:</strong> {formDataToSubmit.total_quantity.toFixed(2)} m³</div>
            <div><strong>{t('form.totalVehicles')}:</strong> {formDataToSubmit.vehicles.length}</div>
            {formDataToSubmit.cutting_boxes_amount && (
              <div><strong>{t('form.cuttingBoxesAmount')}:</strong> {formDataToSubmit.cutting_boxes_amount.toFixed(2)}</div>
            )}
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
    <LocalizationProvider 
      dateAdapter={AdapterDateFns} 
      adapterLocale={dateLocale}
    >
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('form.arrivalTime')}
              </label>
              <Controller
                name="arrival_time"
                control={control}
                rules={{
                  validate: () => {
                    if (!validateTimes()) {
                      return t('form.timeValidation');
                    }
                    return true;
                  }
                }}
                render={({ field: { onChange, value } }) => (
                  <TimePicker
                    value={value ? new Date(`2000-01-01T${value}:00`) : null}
                    onChange={(newValue) => {
                      if (newValue) {
                        const timeString = format(newValue, 'HH:mm');
                        onChange(timeString);
                      } else {
                        onChange('');
                      }
                    }}
                    minutesStep={1}
                    ampm={true}
                    format="hh:mm a"
                    slots={{
                      textField: TextField,
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                        placeholder: isRTL ? 'اختر وقت الوصول' : 'Select arrival time',
                        sx: {
                          '& .MuiOutlinedInput-root': {
                            fontSize: '0.875rem',
                            borderRadius: '0.375rem',
                            direction: isRTL ? 'rtl' : 'ltr',
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#6366f1',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#6366f1',
                            },
                          },
                        },
                      },
                    }}
                  />
                )}
              />
              {errors.arrival_time && (
                <p className="mt-1 text-sm text-red-600">{errors.arrival_time.message}</p>
              )}
            </div>

            {/* Departure Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('form.departureTime')}
              </label>
              <Controller
                name="departure_time"
                control={control}
                rules={{
                  validate: () => {
                    if (!validateTimes()) {
                      return t('form.timeValidation');
                    }
                    return true;
                  }
                }}
                render={({ field: { onChange, value } }) => (
                  <TimePicker
                    value={value ? new Date(`2000-01-01T${value}:00`) : null}
                    onChange={(newValue) => {
                      if (newValue) {
                        const timeString = format(newValue, 'HH:mm');
                        onChange(timeString);
                      } else {
                        onChange('');
                      }
                    }}
                    minutesStep={1}
                    ampm={true}
                    format="hh:mm a"
                    slots={{
                      textField: TextField,
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                        placeholder: isRTL ? 'اختر وقت المغادرة' : 'Select departure time',
                        sx: {
                          '& .MuiOutlinedInput-root': {
                            fontSize: '0.875rem',
                            borderRadius: '0.375rem',
                            direction: isRTL ? 'rtl' : 'ltr',
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#6366f1',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#6366f1',
                            },
                          },
                        },
                      },
                    }}
                  />
                )}
              />
              {errors.departure_time && (
                <p className="mt-1 text-sm text-red-600">{errors.departure_time.message}</p>
              )}
            </div>

            {/* Cutting Boxes Amount */}
            <div>
              <label htmlFor="cutting_boxes_amount" className="block text-sm font-medium text-gray-700 mb-1">
                {t('form.cuttingBoxesAmount')}
              </label>
              <input
                type="number"
                id="cutting_boxes_amount"
                min="0"
                step="0.01"
                {...register('cutting_boxes_amount', {
                  min: { value: 0, message: t('form.quantityMin') },
                })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder={t('form.cuttingBoxesPlaceholder')}
              />
              {errors.cutting_boxes_amount && (
                <p className="mt-1 text-sm text-red-600">{errors.cutting_boxes_amount.message}</p>
              )}
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

                {/* Vehicle Selection - Temporarily Hidden */}
                {false && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('form.selectVehicle')} *
                    </label>
                    {false ? (  // loadingVehicles temporarily disabled
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm text-gray-500">Loading vehicles...</span>
                      </div>
                    ) : (
                      <select
                        onChange={() => {}}  // handleVehicleSelection temporarily disabled
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      >
                        <option value="">اختر مركبة / Select Vehicle</option>
                        {/* vehicleOptions temporarily disabled */}
                      </select>
                    )}
                    {/* errors.vehicles?.[index]?.selected_vehicle_id temporarily disabled */}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tractor Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('form.tractorNumber')} *
                    </label>
                    <input
                      type="text"
                      {...register(`vehicles.${index}.tractor_number`, {
                        required: t('form.tractorNumberRequired'),
                      })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      placeholder="123-ABC"
                    />
                    {errors.vehicles?.[index]?.tractor_number && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.vehicles[index]?.tractor_number?.message}
                      </p>
                    )}
                  </div>

                  {/* Trailer Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('form.trailerNumber')} *
                    </label>
                    <input
                      type="text"
                      {...register(`vehicles.${index}.trailer_number`, {
                        required: t('form.trailerNumberRequired'),
                      })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      placeholder="456-XYZ"
                    />
                    {errors.vehicles?.[index]?.trailer_number && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.vehicles[index]?.trailer_number?.message}
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
                      placeholder="Enter car brand"
                    />
                    {errors.vehicles?.[index]?.car_brand && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.vehicles[index]?.car_brand?.message}
                      </p>
                    )}
                  </div>

                  {/* Vehicle Quantity */}
                  <div>
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
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
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
    </LocalizationProvider>
  );
};