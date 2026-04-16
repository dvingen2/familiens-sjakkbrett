import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { AppProvider } from "./context/AppContext";
import { PwaProvider } from "./context/PwaContext";
import "./styles.css";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`);
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PwaProvider>
      <AppProvider>
        <HashRouter>
          <App />
        </HashRouter>
      </AppProvider>
    </PwaProvider>
  </React.StrictMode>,
);
