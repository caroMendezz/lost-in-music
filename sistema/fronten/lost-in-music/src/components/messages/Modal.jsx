import { useEffect } from "react";
import styles from "./Modal.module.css";

// Ventana modal simple: titulo centrado, X para cerrar (sin accion), Cancelar / Eliminar.
export default function Modal({ title, onClose, onConfirm, confirmLabel = "Eliminar", cancelLabel = "Cancelar", children }) {
    useEffect(() => {
        const onKeyDown = (event) => {
            if (event.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="message-modal-title">
                <div className={styles.modalHeader}>
                    <h3 id="message-modal-title" className={styles.modalTitle}>
                        {title}
                    </h3>
                    <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Cerrar">
                        ✕
                    </button>
                </div>

                <div className={styles.modalBody}>{children}</div>

                <div className={styles.modalActions}>
                    <button type="button" className={styles.modalCancel} onClick={onClose}>
                        {cancelLabel}
                    </button>
                    <button type="button" className={styles.modalConfirm} onClick={onConfirm}>
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
