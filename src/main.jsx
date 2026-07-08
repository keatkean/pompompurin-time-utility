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

// Build identity in the console too, for quick "which build am I on?" checks.
console.info(
  `Pompompurin Time Utility v${import.meta.env.APP_VERSION} (${import.meta.env.APP_COMMIT}, built ${import.meta.env.APP_BUILD_TIME})`
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
