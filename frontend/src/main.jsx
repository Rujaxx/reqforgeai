import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom';
import { store } from './store'; 
import { Provider } from 'react-redux';
import ErrorBoundary from './components/ErrorBoundary.jsx'; 


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary fallback={<div className="error-boundary">Something went wrong. Please try again later.</div>}>
    <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
    </Provider>
    </ErrorBoundary>
  </StrictMode>,

)
