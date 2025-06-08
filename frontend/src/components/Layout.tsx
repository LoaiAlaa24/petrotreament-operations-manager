import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Bars3Icon, 
  HomeIcon, 
  DocumentChartBarIcon,
  UserIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import LanguageSwitcher from './LanguageSwitcher';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  // Update document direction when language changes
  useEffect(() => {
    const isRTL = i18n.language === 'ar';
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
    
    // Add RTL class to body for additional styling control
    if (isRTL) {
      document.body.classList.add('rtl');
      document.body.classList.remove('ltr');
    } else {
      document.body.classList.add('ltr');
      document.body.classList.remove('rtl');
    }
  }, [i18n.language]);

  const navigation = [
    { name: t('nav.dashboard'), href: '/', icon: HomeIcon, current: location.pathname === '/' },
    { name: t('nav.reports'), href: '/reports', icon: DocumentChartBarIcon, current: location.pathname === '/reports' },
  ];

  const isRTL = i18n.language === 'ar';

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        <div className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ease-linear duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setSidebarOpen(false)} />
        
        <div className={`relative flex-1 flex flex-col max-w-xs w-full bg-white transition ease-in-out duration-300 transform ${sidebarOpen ? 'translate-x-0' : isRTL ? 'translate-x-full' : '-translate-x-full'}`}>
          <div className={`absolute top-0 pt-2 ${isRTL ? 'left-0 -ml-12' : 'right-0 -mr-12'}`}>
            <button
              type="button"
              className={`flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white ${isRTL ? 'mr-1' : 'ml-1'}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <img src="/logo-petro.png" alt="P.P.E.S." className={`h-8 w-8 ${isRTL ? 'ml-3' : 'mr-3'}`} />
              <div>
                <h1 className="text-lg font-bold text-gray-900">{t('nav.companyName')}</h1>
                <p className="text-xs text-gray-600">{t('nav.appTitle')}</p>
              </div>
            </div>
            <div className="px-4 mt-4">
              <LanguageSwitcher />
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = item.href;
                  }}
                  className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                    item.current
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className={`h-6 w-6 ${isRTL ? 'ml-4' : 'mr-4'}`} />
                  {item.name}
                </a>
              ))}
            </nav>
          </div>
          
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserIcon className="h-8 w-8 text-gray-400" />
              </div>
              <div className="ml-3">
                <p className="text-base font-medium text-gray-700">{user?.full_name || user?.username}</p>
                <p className="text-sm font-medium text-gray-500">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className={`hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 ${isRTL ? 'right-0' : 'left-0'}`}>
        <div className={`flex-1 flex flex-col min-h-0 bg-white ${isRTL ? 'border-l border-gray-200' : 'border-r border-gray-200'}`}>
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <img src="/logo-petro.png" alt="P.P.E.S." className={`h-10 w-10 ${isRTL ? 'ml-3' : 'mr-3'}`} />
              <div>
                <h1 className="text-xl font-bold text-gray-900">{t('nav.companyName')}</h1>
                <p className="text-sm text-gray-600">{t('nav.appTitle')}</p>
              </div>
            </div>
            <div className="px-4 mt-4">
              <LanguageSwitcher />
            </div>
            <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = item.href;
                  }}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    item.current
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                  {item.name}
                </a>
              ))}
            </nav>
          </div>
          
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center w-full group">
              <div className="flex-shrink-0">
                <UserIcon className="h-8 w-8 text-gray-400" />
              </div>
              <div className={`flex-1 ${isRTL ? 'mr-3' : 'ml-3'}`}>
                <p className="text-sm font-medium text-gray-700">{user?.full_name || user?.username}</p>
                <p className="text-xs font-medium text-gray-500">{user?.role}</p>
              </div>
              <button
                onClick={logout}
                className={`flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 ${isRTL ? 'mr-2' : 'ml-2'}`}
                title={t('nav.logout')}
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`flex flex-col flex-1 ${isRTL ? 'md:pr-64' : 'md:pl-64'}`}>
        <div className={`sticky top-0 z-10 md:hidden pt-1 bg-gray-100 ${isRTL ? 'pr-1 sm:pr-3' : 'pl-1 sm:pl-3'}`}>
          <button
            type="button"
            className={`-mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 ${isRTL ? '-mr-0.5' : '-ml-0.5'}`}
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>
        
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;