import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import ChatWindow from "../../components/messages/ChatWindow";
import ContactInfo from "../../components/messages/ContactInfo";
import ConversationList from "../../components/messages/ConversationList";
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
        selectConversation,
        sendMessage,
        sendAttachment,
        revokeMessage,
        deleteMessageForMe
    } = useMessages(initialUserId);

    const hasChat = selectedUserId !== null;

    // Panel derecho (info del contacto): se muestra por defecto en pantallas anchas.
    // El boton "i" del chat lo oculta/muestra sin cerrar la conversacion.
    const [infoOpen, setInfoOpen] = useState(() => window.innerWidth >= 1000);

    if (authError) {
        return (
            <div className={styles.messagesPage}>
                <p className={styles.messagesPageNotice} role="alert">
                    Tu sesión no es válida o expiró. Inicia sesión nuevamente para ver tus mensajes.
                </p>
            </div>
        );
    }

    return (
        <div className={styles.messagesPage}>
            <div className={`${styles.messagesLayout} ${hasChat && infoOpen ? styles.messagesLayoutWithInfo : ""}`}>
                <ConversationList
                    conversations={conversations}
                    selectedUserId={selectedUserId}
                    myId={myId}
                    loading={loadingConversations}
                    onSelect={selectConversation}
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
                    onRevoke={revokeMessage}
                    onDeleteForMe={deleteMessageForMe}
                    infoOpen={infoOpen}
                    onToggleInfo={() => setInfoOpen((open) => !open)}
                />

                {hasChat && (
                    <ContactInfo
                        key={selectedUserId}
                        contact={contact}
                        messages={messages}
                        hidden={!infoOpen}
                    />
                )}
            </div>
        </div>
    );
}
