import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const docEl = document.documentElement;
if (!docEl.classList.contains("dark")) {
  docEl.classList.add("dark");
}

createRoot(document.getElementById("root")!).render(<App />);
