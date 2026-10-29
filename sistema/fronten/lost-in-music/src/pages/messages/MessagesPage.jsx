import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "../../components/header";
import ChatWindow from "../../components/messages/ChatWindow";
import ContactInfo from "../../components/messages/ContactInfo";
import ConversationList from "../../components/messages/ConversationList";
import DeleteChatModal from "../../components/messages/DeleteChatModal";
import ImageViewer from "../../components/messages/ImageViewer";
import useMessages from "../../hooks/useMessages";
import styles from "./MessagesPage.module.css";

export default function MessagesPage() {
    // /messages?user=5 abre directamente el chat con el usuario 5 (util desde un perfil)
    const [searchParams] = useSearchParams();
    const initialUserId = searchParams.get("user");

    const {
        myId,
        conversations,
        loadingConversations,
        selectedUserId,
        messages,
        contact,
        loadingChat,
        error,
        uploading,
        authError,
        isContactTyping,
        selectConversation,
        sendMessage,
        sendAttachment,
        editMessage,
        revokeMessage,
        deleteMessageForMe,
        deleteConversation,
        sendTyping,
        sendStopTyping
    } = useMessages(initialUserId);

    const hasChat = selectedUserId !== null;

    // Panel derecho (info del contacto): se muestra por defecto en pantallas anchas.
    // El boton "i" del chat lo oculta/muestra sin cerrar la conversacion.
    const [infoOpen, setInfoOpen] = useState(() => window.innerWidth >= 1000);

    // Visor de imagenes a pantalla completa: { conversationId, images, index }.
    // Vive en la pagina para servir tanto al chat como al panel de contenido compartido.
    const [viewer, setViewer] = useState(null);

    // Solo se muestra si pertenece a la conversacion activa: si se cambia de chat con el
    // visor abierto (por ejemplo desde la url) se descarta sin necesidad de un efecto.
    const activeViewer = viewer && viewer.conversationId === selectedUserId ? viewer : null;

    // Conversacion que se quiere eliminar (solo se borra la copia del usuario actual)
    const [chatToDelete, setChatToDelete] = useState(null);

    // Confirmado el borrado: se cierra la ventana y se ejecuta la eliminacion individual
    const handleConfirmDeleteChat = async () => {
        const conversation = chatToDelete;
        setChatToDelete(null);
        if (conversation) await deleteConversation(conversation.user.userId);
    };

    if (authError) {
        return (
            <div className={styles.messagesPage}>
                <Header />
                <p className={styles.messagesPageNotice} role="alert">
                    Tu sesión no es válida o expiró. Inicia sesión nuevamente para ver tus mensajes.
                </p>
            </div>
        );
    }

    return (
        <div className={styles.messagesPage}>
            <Header />

            <div className={`${styles.messagesLayout} ${hasChat && infoOpen ? styles.messagesLayoutWithInfo : ""}`}>
                <ConversationList
                    conversations={conversations}
                    selectedUserId={selectedUserId}
                    myId={myId}
                    loading={loadingConversations}
                    onSelect={selectConversation}
                    onDeleteChat={setChatToDelete}
                />

                <ChatWindow
                    contact={contact}
                    messages={messages}
                    myId={myId}
                    loading={loadingChat}
                    error={error}
                    uploading={uploading}
                    onSend={sendMessage}
                    onAttach={sendAttachment}
                    onEdit={editMessage}
                    onRevoke={revokeMessage}
                    onDeleteForMe={deleteMessageForMe}
                    isContactTyping={isContactTyping}
                    onTyping={sendTyping}
                    onStopTyping={sendStopTyping}
                    infoOpen={infoOpen}
                    onToggleInfo={() => setInfoOpen((open) => !open)}
                    onOpenImage={(images, index) =>
                        setViewer({ conversationId: selectedUserId, images, index })
                    }
                />

                {hasChat && (
                    <ContactInfo
                        key={selectedUserId}
                        contact={contact}
                        messages={messages}
                        hidden={!infoOpen}
                        onOpenImage={(images, index) =>
                            setViewer({ conversationId: selectedUserId, images, index })
                        }
                    />
                )}
            </div>

            {activeViewer && (
                <ImageViewer
                    images={activeViewer.images}
                    initialIndex={activeViewer.index}
                    onClose={() => setViewer(null)}
                />
            )}

            {chatToDelete && (
                <DeleteChatModal onClose={() => setChatToDelete(null)} onConfirm={handleConfirmDeleteChat} />
            )}
        </div>
    );
}
