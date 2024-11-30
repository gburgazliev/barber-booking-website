import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import Header from "./components/Header.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <div className="  md:flex-col justify-items-center md:items-center w-full">
      <Header />
      <App />
    </div>
  </StrictMode>
);
