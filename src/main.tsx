import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/global.css';
import './styles/components.css';
import './styles/layout.css';
import './styles/welcome.css';
import './styles/about.css';
import './styles/features.css';
import './styles/how-it-works.css';
import './styles/companies.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
