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
    onDeleteForMe,
    isContactTyping,
    onTyping,
    onStopTyping,
    // Abre el visor de imagenes a pantalla completa (imagenUrls, indice)
    onOpenImage
}) {
    // Ventana abierta: { type: "revoke" | "deleteForMe", message }
    const [dialog, setDialog] = useState(null);
    // Mensaje que se esta editando (null = campo de escritura normal)
    const [editing, setEditing] = useState(null);
    // Mensaje al que se esta respondiendo (null = sin modo respuesta).
    // Edicion y respuesta son mutuamente excluyentes: solo uno puede estar activo.
    const [replying, setReplying] = useState(null);

    // Al cambiar de conversacion se cierra cualquier ventana, edicion o respuesta pendiente
    const contactId = contact?.userId;
    useEffect(() => {
        setDialog(null);
        setEditing(null);
        setReplying(null);
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

    // Acceso al perfil del usuario desde el encabezado del chat.
    // La navegacion al perfil todavia no esta implementada: por ahora solo se avisa en
    // consola. Cuando exista la ruta de perfil, reemplazar el console.log por la
    // navegacion (por ejemplo: navigate(`/perfil/${contact.userId}`)).
    const handleOpenProfile = () => {
        console.log("Redirigiendo al perfil");
    };
    const closeDialog = () => setDialog(null);

    // Mensaje al que se responde, derivado de la lista actual: si el mensaje original
    // desaparece (por ejemplo, se elimino para ti), el apartado de respuesta se cierra
    // solo y no puede quedar una referencia a un mensaje inexistente.
    const replyTarget =
        replying && messages.some((m) => m.messageId === replying.messageId) ? replying : null;

    // Iniciar edicion: cierra una posible respuesta pendiente (no pueden coexistir)
    const startEdit = (message) => {
        setReplying(null);
        setEditing(message);
    };

    // Iniciar respuesta: cierra una posible edicion pendiente (no pueden coexistir)
    const startReply = (message) => {
        setEditing(null);
        setReplying(message);
    };

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

    // Envia un mensaje nuevo (con la referencia de respuesta si el modo respuesta esta activo).
    // Si se envio bien, se limpia el modo respuesta.
    const handleSend = (content) => {
        const sent = onSend(content, replyTarget?.messageId ?? null);
        if (sent) setReplying(null);
        return sent;
    };

    // Mismo criterio para los adjuntos: conservan la referencia de respuesta si la hay.
    // Recibe uno o varios archivos (lote de imagenes) y, opcionalmente, el pie de foto
    // que se guarda en el mismo mensaje.
    const handleAttach = async (files, content = "") => {
        const sent = await onAttach(files, replyTarget?.messageId ?? null, content);
        if (sent) setReplying(null);
        return sent;
    };

    return (
        <section className={styles.chatWindow}>
            <header className={styles.chatWindowHeader}>
                <Avatar user={contact} size={40} />
                <h3 className={styles.chatWindowName}>
                    <button
                        type="button"
                        className={styles.chatWindowNameButton}
                        onClick={handleOpenProfile}
                        title={`Ver perfil de ${contact.username}`}
                    >
                        {contact.username}
                    </button>
                </h3>

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
                isContactTyping={isContactTyping}
                onRequestEdit={startEdit}
                onRequestReply={startReply}
                onRequestRevoke={(message) => setDialog({ type: "revoke", message })}
                onRequestDeleteForMe={(message) => setDialog({ type: "deleteForMe", message })}
                // Durante la edicion se bloquean las demas funcionalidades de TODOS los globos.
                // Durante la respuesta el bloqueo NO aplica: los globos siguen disponibles.
                actionsLocked={Boolean(editing)}
                onOpenImage={onOpenImage}
            />

            {error && (
                <p className={styles.chatWindowError} role="alert">
                    {error}
                </p>
            )}

            <MessageInput
                onSend={handleSend}
                onAttach={handleAttach}
                uploading={uploading}
                disabled={loading}
                editing={editing}
                onSaveEdit={saveEdit}
                onCancelEdit={() => setEditing(null)}
                replying={replyTarget}
                onCancelReply={() => setReplying(null)}
                contact={contact}
                myId={myId}
                onTyping={onTyping}
                onStopTyping={onStopTyping}
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
