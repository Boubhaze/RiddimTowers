import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("FATAL: Could not find root element to mount to.");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("Riddim Tower App Mounted Successfully.");
  } catch (error) {
    console.error("FATAL: Error mounting React app:", error);
  }
}
