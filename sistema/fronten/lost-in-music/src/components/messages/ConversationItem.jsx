import { useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";
import { formatRelative } from "./formatters";
import styles from "./ConversationItem.module.css";

function getPreview(lastMessage, myId, username) {
    if (!lastMessage) return "Nueva conversación";

    const isOwn = Number(lastMessage.senderId) === myId;

    if (lastMessage.deletedForAll) return isOwn ? "Eliminaste un mensaje" : `${username} eliminó un mensaje`;

    if (lastMessage.messageType === "image") {
        // Mensaje con varias fotos: se indica la cantidad
        const count = Array.isArray(lastMessage.fileUrls) ? lastMessage.fileUrls.length : 0;
        if (count > 1) return isOwn ? `Enviaste ${count} fotos` : `Te envió ${count} fotos`;
        return isOwn ? "Enviaste una imagen" : "Te envió una imagen";
    }
    if (lastMessage.messageType === "file") return isOwn ? "Enviaste un archivo" : "Te envió un archivo";

    return isOwn ? `Tú: ${lastMessage.content || ""}` : lastMessage.content || "";
}

export default function ConversationItem({ conversation, isActive, myId, onSelect, onRequestDelete }) {
    const { user, lastMessage, unreadCount } = conversation;
    const hasUnread = unreadCount > 0;
    const strong = hasUnread ? styles.conversationUnreadText : "";

    // Menu "..." de la fila: se abre posicionado junto al boton y se cierra solo
    // al hacer click fuera, con Escape o al desplazar/redimensionar la pagina.
    const [menuOpen, setMenuOpen] = useState(false);
    // Posicion del menu en coordenadas de viewport (asi nunca lo recorta el scroll de la lista)
    const [anchor, setAnchor] = useState(null);
    const itemRef = useRef(null);

    useEffect(() => {
        if (!menuOpen) return undefined;

        const close = () => setMenuOpen(false);
        const onPointerDown = (event) => {
            if (itemRef.current?.contains(event.target)) return;
            setMenuOpen(false);
        };
        const onKeyDown = (event) => {
            if (event.key === "Escape") setMenuOpen(false);
        };

        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        // capture: cierra el menu tambien si el scroll ocurre en cualquier contenedor ancestro
        window.addEventListener("scroll", close, true);
        window.addEventListener("resize", close);

        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("scroll", close, true);
            window.removeEventListener("resize", close);
        };
    }, [menuOpen]);

    const handleMenuToggle = (event) => {
        event.stopPropagation(); // el click no debe abrir la conversacion

        if (menuOpen) {
            setMenuOpen(false);
            return;
        }

        const rect = event.currentTarget.getBoundingClientRect();
        setAnchor({
            // si no queda lugar abajo, el menu se abre hacia arriba
            top: rect.bottom + 6,
            bottom: window.innerHeight - rect.top + 6,
            right: window.innerWidth - rect.right,
            opensUp: rect.bottom + 56 > window.innerHeight
        });
        setMenuOpen(true);
    };

    const handleSelect = () => {
        setMenuOpen(false);
        onSelect(user.userId);
    };

    return (
        <li ref={itemRef} className={`${styles.conversationRow} ${menuOpen ? styles.conversationRowMenuOpen : ""}`}>
            <button
                type="button"
                className={`${styles.conversationItem} ${isActive ? styles.conversationItemActive : ""}`}
                onClick={handleSelect}
            >
                <Avatar user={user} size={56} />

                <div className={styles.conversationBody}>
                    <span className={`${styles.conversationName} ${strong}`}>{user.username}</span>
                    <span className={styles.conversationLine}>
                        <span className={`${styles.conversationPreview} ${strong}`}>
                            {getPreview(lastMessage, myId, user.username)}
                        </span>
                        {lastMessage && (
                            <span className={styles.conversationDate}>· {formatRelative(lastMessage.sent_at)}</span>
                        )}
                    </span>
                </div>

                {hasUnread && <span className={styles.conversationBadge}>{unreadCount}</span>}
            </button>

            {/* Tres puntos: solo visible al pasar el puntero sobre la conversacion */}
            <button
                type="button"
                className={styles.conversationMore}
                onClick={handleMenuToggle}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label={`Opciones del chat con ${user.username}`}
                title="Opciones del chat"
            >
                ⋯
            </button>

            {menuOpen && anchor && (
                <div
                    className={styles.conversationMenu}
                    role="menu"
                    style={
                        anchor.opensUp
                            ? { bottom: anchor.bottom, right: anchor.right }
                            : { top: anchor.top, right: anchor.right }
                    }
                >
                    <button
                        type="button"
                        role="menuitem"
                        className={styles.conversationMenuItem}
                        onClick={() => {
                            setMenuOpen(false);
                            onRequestDelete?.(conversation);
                        }}
                    >
                        <span className={styles.conversationMenuItemIcon} aria-hidden="true">
                            🗑
                        </span>
                        Eliminar chat
                    </button>
                </div>
            )}
        </li>
    );
}
