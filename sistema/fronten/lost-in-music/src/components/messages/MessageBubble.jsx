import { useEffect, useRef, useState } from "react";
import { resolveFileUrl } from "../../services/messageService";
import Avatar from "./Avatar";
import styles from "./MessageBubble.module.css";

const REVOKED_OWN_TEXT = "Eliminaste este mensaje";
const revokedTextForReceiver = (username) => `${username} eliminó este mensaje`;

export default function MessageBubble({ message, isOwn, contact, onRequestRevoke, onRequestDeleteForMe }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const actionsRef = useRef(null);

    const revoked = Boolean(message.deletedForAll);
    const url = resolveFileUrl(message.fileUrl);

    // Cierra el menu al hacer click fuera o con Escape
    useEffect(() => {
        if (!menuOpen) return undefined;

        const onPointerDown = (event) => {
            if (!actionsRef.current?.contains(event.target)) setMenuOpen(false);
        };
        const onKeyDown = (event) => {
            if (event.key === "Escape") setMenuOpen(false);
        };

        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [menuOpen]);

    const bubbleClass = revoked ? styles.bubbleRevoked : isOwn ? styles.bubbleOwn : styles.bubbleOther;

    return (
        <div className={`${styles.bubbleRow} ${isOwn ? styles.bubbleRowOwn : ""}`}>
            {!isOwn && <Avatar user={contact} size={28} />}

            {/* Acciones al pasar el mouse: solo en los mensajes propios */}
            {isOwn && (
                <div
                    ref={actionsRef}
                    className={`${styles.bubbleActions} ${menuOpen ? styles.bubbleActionsOpen : ""}`}
                >
                    {menuOpen && (
                        <div className={styles.bubbleMenu} role="menu">
                            {revoked ? (
                                <button
                                    type="button"
                                    role="menuitem"
                                    className={styles.bubbleMenuItem}
                                    onClick={() => {
                                        setMenuOpen(false);
                                        onRequestDeleteForMe(message);
                                    }}
                                >
                                    Eliminar
                                </button>
                            ) : (
                                <>
                                    {/* Editar: solo visible por ahora, todavia sin funcionalidad */}
                                    <button
                                        type="button"
                                        role="menuitem"
                                        className={styles.bubbleMenuItem}
                                        disabled
                                        title="Próximamente"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        type="button"
                                        role="menuitem"
                                        className={styles.bubbleMenuItem}
                                        onClick={() => {
                                            setMenuOpen(false);
                                            onRequestRevoke(message);
                                        }}
                                    >
                                        Anular envío
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    <button
                        type="button"
                        className={styles.bubbleMore}
                        onClick={() => setMenuOpen((open) => !open)}
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                        aria-label="Acciones del mensaje"
                    >
                        ⋯
                    </button>

                    {/* Responder: solo visual por ahora (todavia sin funcionalidad) */}
                    {!revoked && (
                        <span className={styles.bubbleReply} aria-hidden="true">
                            ↩️
                        </span>
                    )}
                </div>
            )}

            <div className={`${styles.bubble} ${bubbleClass}`}>
                {revoked ? (
                    <p className={styles.bubbleText}>
                        {isOwn ? REVOKED_OWN_TEXT : revokedTextForReceiver(contact.username)}
                    </p>
                ) : (
                    <>
                        {message.messageType === "image" && url && (
                            <a href={url} target="_blank" rel="noreferrer">
                                <img className={styles.bubbleImage} src={url} alt={message.fileName || "Imagen"} />
                            </a>
                        )}

                        {message.messageType === "file" && url && (
                            <a className={styles.bubbleFile} href={url} target="_blank" rel="noreferrer">
                                {message.fileName || "Archivo adjunto"}
                            </a>
                        )}

                        {message.content && <p className={styles.bubbleText}>{message.content}</p>}
                    </>
                )}
            </div>
        </div>
    );
}
