import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./popup.css";
import TicketForm from "./components/TicketForm";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TicketForm />
  </StrictMode>,
);
