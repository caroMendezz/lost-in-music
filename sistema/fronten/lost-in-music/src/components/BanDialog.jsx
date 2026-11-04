import { useState } from "react";
import { banUser } from "../services/adminApi";
import "../styles/admin.css";

// Duraciones disponibles (en minutos). Deben coincidir con las que acepta el backend.
const BAN_DURATIONS = [
  { value: 15, label: "15 minutos" },
  { value: 60, label: "1 hora" },
  { value: 360, label: "6 horas" },
  { value: 1440, label: "24 horas" },
  { value: 10080, label: "7 días" },
  { value: 43200, label: "30 días" },
];

/**
 * Ventana emergente para aplicar una sanción a un usuario.
 *
 * Props:
 *   user       — { userId, username }
 *   onClose    — () => void
 *   onDone     — (data) => void  (data es la respuesta del backend)
 *   initialReason — texto opcional para precargar el motivo
 */
export default function BanDialog({ user, onClose, onDone, initialReason = "" }) {
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [reason, setReason] = useState(initialReason);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const data = await banUser(
        user.userId,
        Number(durationMinutes),
        reason.trim()
      );

      onDone?.(data);
    } catch (err) {
      setError(err.message || "No se pudo aplicar la sanción");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="admin-dialog-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose?.();
      }}
    >
      <form
        className="admin-dialog"
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-dialog-title"
      >
        <h3 id="admin-dialog-title">Sancionar a @{user.username}</h3>

        <label className="admin-field">
          <span>Duración de la suspensión</span>
          <select
            value={durationMinutes}
            onChange={(event) => setDurationMinutes(event.target.value)}
          >
            {BAN_DURATIONS.map((duration) => (
              <option key={duration.value} value={duration.value}>
                {duration.label}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-field">
          <span>Motivo (opcional)</span>
          <input
            type="text"
            maxLength={255}
            value={reason}
            placeholder="Ej.: incumplimiento de las normas"
            onChange={(event) => setReason(event.target.value)}
          />
        </label>

        {error && <p className="admin-error">{error}</p>}

        <div className="admin-dialog-actions">
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            onClick={onClose}
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="admin-btn admin-btn--danger"
            disabled={submitting}
          >
            {submitting ? "Aplicando…" : "Aplicar sanción"}
          </button>
        </div>
      </form>
    </div>
  );
}
