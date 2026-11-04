import { useEffect, useRef, useState } from "react";
import "../styles/ReportModal.css";
import { sendReport } from "../services/reportsApi";

// Razones sugeridas: al hacer click se completan en el cuadro de texto.
const REASONS = [
  "Spam o publicidad",
  "Acoso o intimidación",
  "Discurso de odio",
  "Contenido violento",
  "Contenido sexual",
  "Información falsa",
  "Suplantación de identidad",
];

const MIN_LENGTH = 8;
const MAX_LENGTH = 500;

/**
 * Ventana emergente para denunciar a un usuario o una publicación.
 *
 * Props:
 *   target     — { type: "user" | "post", userId?, username?, postId?, postText? }
 *   onClose    — () => void
 *   onSubmitted— (report) => void  (opcional)
 */
export default function ReportModal({ target, onClose, onSubmitted }) {
  const isPost = target?.type === "post";

  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const textareaRef = useRef(null);

  const trimmed = reason.trim();
  const canSend = trimmed.length >= MIN_LENGTH && !submitting && !sent;

  // Cerrar con Escape y bloquear el scroll del fondo mientras está abierto.
  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "Escape" && !submitting) onClose?.();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKey);

    const focusTimer = setTimeout(() => textareaRef.current?.focus(), 60);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
      clearTimeout(focusTimer);
    };
  }, [onClose, submitting]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canSend) return;

    setSubmitting(true);
    setError("");

    try {
      const data = await sendReport({
        targetType: isPost ? "post" : "user",
        targetUserId: isPost ? undefined : target?.userId,
        targetPostId: isPost ? target?.postId : undefined,
        reason: trimmed,
      });

      setSent(true);
      onSubmitted?.(data?.report);
    } catch (err) {
      setError(err.message || "No se pudo enviar el reporte");
    } finally {
      setSubmitting(false);
    }
  };

  const title = isPost ? "Reportar publicación" : "Reportar usuario";
  const subtitle = target?.username ? `@${target.username}` : null;
  const postPreview = isPost
    ? String(target?.postText || "").trim().slice(0, 160)
    : "";

  return (
    <div
      className="rm-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose?.();
      }}
    >
      <form
        className="rm-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rm-title"
        onSubmit={handleSubmit}
      >
        <header className="rm-header">
          <div className="rm-icon" aria-hidden="true">
            🚩
          </div>

          <div className="rm-heading">
            <h2 id="rm-title">{title}</h2>
            {subtitle && <p className="rm-subtitle">{subtitle}</p>}
          </div>

          <button
            type="button"
            className="rm-close"
            aria-label="Cerrar"
            onClick={onClose}
            disabled={submitting}
          >
            ×
          </button>
        </header>

        {sent ? (
          <div className="rm-success" role="status">
            <span className="rm-success-icon" aria-hidden="true">
              ✓
            </span>
            <h3>Reporte enviado</h3>
            <p>
              Gracias por avisarnos. Un administrador va a revisar el caso y
              decidirá si corresponde una sanción.
            </p>
            <button type="button" className="rm-btn rm-btn--primary" onClick={onClose}>
              Cerrar
            </button>
          </div>
        ) : (
          <>
            {postPreview && (
              <p className="rm-context">
                <strong>Publicación:</strong> “{postPreview}
                {String(target?.postText || "").trim().length > 160 ? "…" : ""}”
              </p>
            )}

            <div className="rm-suggestions" aria-label="Motivos frecuentes">
              {REASONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className={`rm-chip ${reason === suggestion ? "rm-chip--active" : ""}`}
                  onClick={() => {
                    setReason(suggestion);
                    setError("");
                    textareaRef.current?.focus();
                  }}
                  disabled={submitting}
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <label className="rm-field" htmlFor="rm-reason">
              <span>Contanos qué pasó y por qué lo reportás</span>

              <textarea
                id="rm-reason"
                ref={textareaRef}
                className="rm-textarea"
                rows={4}
                maxLength={MAX_LENGTH}
                value={reason}
                placeholder={
                  isPost
                    ? "Ej.: esta publicación incita al odio contra otros usuarios…"
                    : "Ej.: este usuario me está acosando por mensajes privados…"
                }
                onChange={(event) => {
                  setReason(event.target.value);
                  if (error) setError("");
                }}
                disabled={submitting}
              />

              <span
                className={`rm-counter ${
                  trimmed.length > 0 && trimmed.length < MIN_LENGTH
                    ? "rm-counter--warn"
                    : ""
                }`}
              >
                {reason.length}/{MAX_LENGTH} · mínimo {MIN_LENGTH} caracteres
              </span>
            </label>

            {error && (
              <p className="rm-error" role="alert">
                {error}
              </p>
            )}

            <p className="rm-note">
              Los reportes son revisados por el equipo de administración. Los
              reportes falsos también pueden ser sancionados.
            </p>

            <div className="rm-actions">
              <button
                type="button"
                className="rm-btn rm-btn--ghost"
                onClick={onClose}
                disabled={submitting}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="rm-btn rm-btn--danger"
                disabled={!canSend}
              >
                {submitting ? "Enviando…" : "Enviar reporte"}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
