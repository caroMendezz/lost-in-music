import { useEffect, useState } from "react";
import "../styles/BanModal.css";

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatRemaining = (ms) => {
  if (ms <= 0) return null;

  const totalMinutes = Math.ceil(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  const parts = [];
  if (days) parts.push(`${days} ${days === 1 ? "día" : "días"}`);
  if (hours) parts.push(`${hours} ${hours === 1 ? "hora" : "horas"}`);
  if (minutes || !parts.length) {
    parts.push(`${minutes} ${minutes === 1 ? "minuto" : "minutos"}`);
  }

  return parts.join(" y ");
};

/**
 * Ventana emergente que se muestra en cualquier sección de la aplicación
 * cuando el backend informa que la cuenta fue suspendida temporalmente.
 */
export default function BanModal({ ban, onClose }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const untilDate = ban?.bannedUntil ? formatDate(ban.bannedUntil) : null;
  const remaining = ban?.bannedUntil
    ? formatRemaining(new Date(ban.bannedUntil).getTime() - now)
    : null;

  return (
    <div className="ban-overlay">
      <div
        className="ban-card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="ban-title"
        aria-describedby="ban-description"
      >
        <div className="ban-icon" aria-hidden="true">
          ⏳
        </div>

        <h2 id="ban-title" className="ban-title">
          Cuenta suspendida temporalmente
        </h2>

        <p id="ban-description" className="ban-text">
          Un administrador suspendió tu cuenta. No vas a poder iniciar sesión ni
          usar la red social hasta que la sanción termine.
        </p>

        {untilDate && (
          <div className="ban-detail">
            <span className="ban-detail-label">Duración de la sanción</span>
            <strong className="ban-detail-value">
              Hasta el {untilDate} hs
            </strong>
            {remaining && (
              <span className="ban-remaining">
                Tiempo restante: {remaining}
              </span>
            )}
          </div>
        )}

        {ban?.banReason && (
          <p className="ban-reason">
            <strong>Motivo:</strong> {ban.banReason}
          </p>
        )}

        <button type="button" className="ban-button" onClick={onClose}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
