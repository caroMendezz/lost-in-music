import React from "react";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";
import aero from "../../styles/aero.module.css";

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

// Muestra el toast que devuelve useToast(). La region aria-live queda siempre
// montada para que los lectores de pantalla anuncien cada aviso.
export default function Toast({ toast }) {
  const Icon = toast ? ICONS[toast.type] || Info : null;

  return (
    <div className={aero["toast-region"]} role="status" aria-live="polite">
      {toast && (
        <div key={toast.id} className={`${aero.toast} ${aero[`toast-${toast.type}`] || ""}`}>
          <Icon size={16} aria-hidden="true" />
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
