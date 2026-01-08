import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// import { ErrorBoundary } from './components/common/ErrorBoundary'; // Removed manual import if it was there or if I am overwriting
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { initMonitoring } from './services/monitoring';

initMonitoring();

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);