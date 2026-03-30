import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes';
import OfflineBanner from './components/common/OfflineBanner';
import './styles/globals.css';

/**
 * App Component
 * Root component with providers and routing
 */
const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OfflineBanner />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
