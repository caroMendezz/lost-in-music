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
    onRevoke,
    onDeleteForMe
}) {
    // Ventana abierta: { type: "revoke" | "deleteForMe", message }
    const [dialog, setDialog] = useState(null);

    // Al cambiar de conversacion se cierra cualquier ventana pendiente
    const contactId = contact?.userId;
    useEffect(() => {
        setDialog(null);
    }, [contactId]);

    if (!contact) {
        return (
            <section className={styles.chatWindow}>
                <p className={styles.chatWindowEmpty}>No hay chats seleccionados</p>
            </section>
        );
    }

    const infoLabel = infoOpen ? "Ocultar información del contacto" : "Mostrar información del contacto";
    const closeDialog = () => setDialog(null);

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
                onRequestRevoke={(message) => setDialog({ type: "revoke", message })}
                onRequestDeleteForMe={(message) => setDialog({ type: "deleteForMe", message })}
            />

            {error && (
                <p className={styles.chatWindowError} role="alert">
                    {error}
                </p>
            )}

            <MessageInput onSend={onSend} onAttach={onAttach} uploading={uploading} disabled={loading} />

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
