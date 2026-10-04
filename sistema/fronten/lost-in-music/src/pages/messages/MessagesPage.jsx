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
        deleteMessage
    } = useMessages(initialUserId);

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
            <div className={styles.messagesLayout}>
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
                    onDelete={deleteMessage}
                />

                <ContactInfo contact={contact} messages={messages} />
            </div>
        </div>
    );
}
