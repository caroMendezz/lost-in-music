import { useEffect, useState } from "react";
import Avatar from "./Avatar";
import DeleteForMeModal from "./DeleteForMeModal";
import MessageInput from "./MessageInput";
import MessageList from "./MessageList";
import RevokeMessageModal from "./RevokeMessageModal";
import styles from "./ChatWindow.module.css";

export default function ChatWindow({
    contact,
    messages,
    myId,
    loading,
    error,
    uploading,
    infoOpen,
    onToggleInfo,
    onSend,
    onAttach,
    onEdit,
    onRevoke,
    onDeleteForMe
}) {
    // Ventana abierta: { type: "revoke" | "deleteForMe", message }
    const [dialog, setDialog] = useState(null);
    // Mensaje que se esta editando (null = campo de escritura normal)
    const [editing, setEditing] = useState(null);

    // Al cambiar de conversacion se cierra cualquier ventana o edicion pendiente
    const contactId = contact?.userId;
    useEffect(() => {
        setDialog(null);
        setEditing(null);
    }, [contactId]);

    // Si el mensaje en edicion desaparece o es anulado, se sale del modo edicion
    useEffect(() => {
        if (editing && !messages.some((m) => m.messageId === editing.messageId && !m.deletedForAll)) {
            setEditing(null);
        }
    }, [messages, editing]);

    if (!contact) {
        return (
            <section className={styles.chatWindow}>
                <p className={styles.chatWindowEmpty}>No hay chats seleccionados</p>
            </section>
        );
    }

    const infoLabel = infoOpen ? "Ocultar información del contacto" : "Mostrar información del contacto";
    const closeDialog = () => setDialog(null);

    // Guarda la edicion sobre el mensaje existente. Devuelve false si no se pudo (sigue en modo edicion).
    const saveEdit = (content) => {
        const text = content.trim();
        if (!text) return false;

        // Sin cambios: se cierra la edicion sin tocar el mensaje
        if (text !== (editing.content || "") && !onEdit(editing.messageId, text)) {
            return false;
        }

        setEditing(null);
        return true;
    };

    return (
        <section className={styles.chatWindow}>
            <header className={styles.chatWindowHeader}>
                <Avatar user={contact} size={40} />
                <h3 className={styles.chatWindowName}>{contact.username}</h3>

                {/* Solo oculta/muestra el panel derecho: la conversacion no se cierra */}
                <button
                    type="button"
                    className={styles.chatWindowInfo}
                    onClick={onToggleInfo}
                    aria-pressed={infoOpen}
                    aria-label={infoLabel}
                    title={infoLabel}
                >
                    i
                </button>
            </header>

            <MessageList
                messages={messages}
                contact={contact}
                myId={myId}
                loading={loading}
                onRequestEdit={(message) => setEditing(message)}
                onRequestRevoke={(message) => setDialog({ type: "revoke", message })}
                onRequestDeleteForMe={(message) => setDialog({ type: "deleteForMe", message })}
            />

            {error && (
                <p className={styles.chatWindowError} role="alert">
                    {error}
                </p>
            )}

            <MessageInput
                onSend={onSend}
                onAttach={onAttach}
                uploading={uploading}
                disabled={loading}
                editing={editing}
                onSaveEdit={saveEdit}
                onCancelEdit={() => setEditing(null)}
            />

            {dialog?.type === "revoke" && (
                <RevokeMessageModal
                    onClose={closeDialog}
                    onConfirm={(scope) => {
                        if (scope === "all") {
                            onRevoke(dialog.message.messageId);
                            closeDialog();
                        } else {
                            // "Anular el envio para ti" abre la ventana "Eliminar para ti"
                            setDialog({ type: "deleteForMe", message: dialog.message });
                        }
                    }}
                />
            )}

            {dialog?.type === "deleteForMe" && (
                <DeleteForMeModal
                    onClose={closeDialog}
                    onConfirm={() => {
                        onDeleteForMe(dialog.message.messageId);
                        closeDialog();
                    }}
                />
            )}
        </section>
    );
}
