import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/noto-sans-kr";
import App from "./App.jsx";
import "./styles.css";
import "./showcase-v2.css";
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
