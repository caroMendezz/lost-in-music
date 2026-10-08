import { useState } from "react";
import Modal from "./Modal";
import styles from "./RevokeMessageModal.module.css";

// onConfirm recibe "all" (anular para todos) o "me" (anular para ti)
export default function RevokeMessageModal({ onClose, onConfirm }) {
    const [scope, setScope] = useState("all");

    return (
        <Modal
            title="¿Para quién quieres anular el envío de este mensaje?"
            onClose={onClose}
            onConfirm={() => onConfirm(scope)}
        >
            <label className={styles.revokeOption}>
                <input
                    type="radio"
                    name="revoke-scope"
                    className={styles.revokeRadio}
                    checked={scope === "all"}
                    onChange={() => setScope("all")}
                />
                <span className={styles.revokeText}>
                    <strong>Anular el envío para todos</strong>
                    <span className={styles.revokeDetail}>
                        Se anulará el envío de este mensaje para todas las personas del chat. Es posible que los
                        demás ya lo hayan visto o reenviado. Los mensajes anulados se pueden incluir en reportes de
                        todos modos.
                    </span>
                </span>
            </label>

            <label className={styles.revokeOption}>
                <input
                    type="radio"
                    name="revoke-scope"
                    className={styles.revokeRadio}
                    checked={scope === "me"}
                    onChange={() => setScope("me")}
                />
                <span className={styles.revokeText}>
                    <strong>Anular el envío para ti</strong>
                    <span className={styles.revokeDetail}>
                        Se eliminará el mensaje de tus dispositivos, pero los demás miembros del chat podrán seguir
                        viéndolo.
                    </span>
                </span>
            </label>
        </Modal>
    );
}
