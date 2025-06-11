import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { 
  ChartBarIcon, 
  DocumentArrowDownIcon,
  ArrowRightOnRectangleIcon,
  PlusIcon 
} from '@heroicons/react/24/outline';
import LanguageSwitcher from './LanguageSwitcher';

interface NavigationProps {
  onLogout?: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ onLogout }) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const isRTL = i18n.language === 'ar';

  const navigation = [
    {
      name: t('nav.addReception'),
      href: '/',
      icon: PlusIcon,
      current: location.pathname === '/' || location.pathname === '/enhanced-reception'
    },
    {
      name: t('nav.dashboard'),
      href: '/dashboard',
      icon: ChartBarIcon,
      current: location.pathname === '/dashboard'
    },
    {
      name: t('nav.reports'),
      href: '/reports',
      icon: DocumentArrowDownIcon,
      current: location.pathname === '/reports'
    }
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <img 
                src="/logo-petro.svg" 
                alt="P.P.E.S." 
                className="h-18 w-12"
              />
              <div className={`ml-2 ${isRTL ? 'mr-2 ml-0' : ''}`}>
                <span className="text-xl font-bold text-gray-900">
                  {t('nav.companyName')}
                </span>
                <span className="block text-sm text-gray-600">
                  {t('nav.appTitle')}
                </span>
              </div>
            </div>
            <div className={`hidden sm:ml-6 sm:flex sm:space-x-8 ${isRTL ? 'sm:mr-6 sm:ml-0 sm:space-x-reverse' : ''}`}>
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    item.current
                      ? 'border-primary-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  <item.icon className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side - Language switcher and logout */}
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            
            {onLogout && (
              <button
                onClick={onLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <ArrowRightOnRectangleIcon className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('nav.logout')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="sm:hidden">
        <div className="pt-2 pb-3 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`${
                item.current
                  ? 'bg-primary-50 border-primary-500 text-primary-700'
                  : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
            >
              <div className="flex items-center">
                <item.icon className={`h-5 w-5 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                {item.name}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;