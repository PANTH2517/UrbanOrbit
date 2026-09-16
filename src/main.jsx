import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./app";
import ErrorBoundary from "./Components/ErrorBoundary";
import { ToastProvider } from "./Components/ui/Toast";
import { initMonitoring } from "./monitoring";
import "./index.css";

initMonitoring();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
