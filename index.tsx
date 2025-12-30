import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("Smart English: Initializing App...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Smart English: Root element not found!");
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("Smart English: Mount successful.");
} catch (error) {
  console.error("Smart English: Critical initialization error:", error);
}