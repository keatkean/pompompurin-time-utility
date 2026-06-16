import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Self-hosted fonts (latin subset, the weights the theme uses) — bundled and
// precached so they load offline and no request leaks to Google Fonts.
import '@fontsource/baloo-2/latin-400.css';
import '@fontsource/baloo-2/latin-700.css';
import '@fontsource/quicksand/latin-400.css';
import '@fontsource/quicksand/latin-700.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
