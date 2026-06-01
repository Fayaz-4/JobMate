import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

window.onerror = function (msg, url, line, col, error) {
  document.body.innerHTML = `<div style="padding: 20px; color: red;">
    <h2>Runtime Error</h2>
    <p><b>Message:</b> ${msg}</p>
    <p><b>URL:</b> ${url}:${line}:${col}</p>
    <pre>${error ? error.stack : ''}</pre>
  </div>`;
};

window.addEventListener("unhandledrejection", function(promiseRejectionEvent) { 
  document.body.innerHTML += `<div style="padding: 20px; color: red;">
    <h2>Unhandled Promise Rejection</h2>
    <pre>${promiseRejectionEvent.reason}</pre>
  </div>`;
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
