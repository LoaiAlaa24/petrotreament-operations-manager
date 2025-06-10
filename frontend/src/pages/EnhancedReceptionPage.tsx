import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { EnhancedVehicleReceptionForm } from '../components/EnhancedVehicleReceptionForm';
import { EnhancedVehicleReceptionCreate } from '../types';
import apiService from '../services/api';

export const EnhancedReceptionPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [receptionNumber, setReceptionNumber] = useState<string>('');

  const handleSubmit = async (data: EnhancedVehicleReceptionCreate) => {
    setIsLoading(true);
    try {
      console.log('📝 Submitting enhanced reception:', data);
      const response = await apiService.createEnhancedVehicleReception(data);
      console.log('✅ Reception created:', response);
      
      setReceptionNumber(response.reception_number || `RCP-${response.id}`);
      setIsSubmitted(true);
    } catch (error) {
      console.error('❌ Failed to create reception:', error);
      alert('Failed to create reception. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-lg rounded-lg p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {t('form.submissionSuccess')}
            </h2>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-lg text-gray-700 mb-2">
                <strong>{t('form.receptionNumber')}:</strong>
              </p>
              <p className="text-2xl font-mono font-bold text-primary-600">
                {receptionNumber}
              </p>
            </div>
            
            <p className="text-gray-600 mb-8">
              Your enhanced vehicle reception has been successfully submitted and assigned a unique reception number.
            </p>
            
            <button
              onClick={handleBackToDashboard}
              className="px-6 py-3 text-lg font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {t('common.back')} to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <div>
                  <button
                    onClick={handleCancel}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    Dashboard
                  </button>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <svg
                    className="flex-shrink-0 h-5 w-5 text-gray-300"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="ml-4 text-sm font-medium text-gray-500">
                    {t('form.addNewEnhanced')}
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        <EnhancedVehicleReceptionForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};