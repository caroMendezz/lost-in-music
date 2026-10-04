import Avatar from "./Avatar";
import MessageInput from "./MessageInput";
import MessageList from "./MessageList";
import styles from "./ChatWindow.module.css";

export default function ChatWindow({ contact, messages, myId, loading, error, uploading, onSend, onAttach, onDelete }) {
    if (!contact) {
        return (
            <section className={styles.chatWindow}>
                <p className={styles.chatWindowEmpty}>Selecciona una conversación para empezar a chatear.</p>
            </section>
        );
    }

    return (
        <section className={styles.chatWindow}>
            <header className={styles.chatWindowHeader}>
                <Avatar user={contact} size={40} />
                <h3 className={styles.chatWindowName}>{contact.username}</h3>
            </header>

            <MessageList messages={messages} contact={contact} myId={myId} loading={loading} onDelete={onDelete} />

            {error && (
                <p className={styles.chatWindowError} role="alert">
                    {error}
                </p>
            )}

            <MessageInput onSend={onSend} onAttach={onAttach} uploading={uploading} disabled={loading} />
        </section>
    );
}
