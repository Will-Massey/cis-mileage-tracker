import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

/**
 * Navigation Component
 * Bottom navigation for mobile devices
 * Fixed at bottom of screen
 */
const Navigation = () => {
  const location = useLocation();
  
  // Don't show navigation on auth pages
  const authPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
  if (authPaths.includes(location.pathname)) {
    return null;
  }

  const navItems = [
    {
      path: '/dashboard',
      label: 'Home',
      icon: (props) => (
        <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      path: '/trips',
      label: 'Trips',
      icon: (props) => (
        <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    },
    {
      path: '/add-trip',
      label: 'Add',
      isAction: true,
      icon: (props) => (
        <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      )
    },
    {
      path: '/reports',
      label: 'Reports',
      icon: (props) => (
        <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      path: '/profile',
      label: 'Profile',
      icon: (props) => (
        <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom md:hidden z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex flex-col items-center justify-center flex-1 h-full
              ${item.isAction 
                ? 'relative -top-4' 
                : ''
              }
              ${isActive && !item.isAction
                ? 'text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
              }
            `}
          >
            {item.isAction ? (
              <div className="w-14 h-14 bg-primary-600 rounded-full flex items-center justify-center shadow-lg">
                <item.icon className="w-7 h-7 text-white" />
              </div>
            ) : (
              <>
                <item.icon className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
