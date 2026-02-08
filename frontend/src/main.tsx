// main.tsx — Think of this as main() in C.
// It finds the <div id="root"> in index.html and renders our React app into it.

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
