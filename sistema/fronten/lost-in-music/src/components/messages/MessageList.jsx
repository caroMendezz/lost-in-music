import { useEffect, useRef } from "react";
import Avatar from "./Avatar";
import MessageBubble from "./MessageBubble";
import { formatDayLabel } from "./formatters";
import styles from "./MessageList.module.css";

export default function MessageList({ messages, contact, myId, loading, onDelete }) {
    const endRef = useRef(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ block: "end" });
    }, [messages]);

    let lastDay = null;

    return (
        <div className={styles.messageList}>
            <div className={styles.messageListIntro}>
                <Avatar user={contact} size={72} />
                <strong>{contact.username}</strong>
                <span className={styles.messageListIntroInfo}>{contact.followerAmount ?? 0} seguidores</span>
                {contact.ubication && <span className={styles.messageListIntroInfo}>{contact.ubication}</span>}
            </div>

            {loading && <p className={styles.messageListStatus}>Cargando mensajes...</p>}

            {!loading && messages.length === 0 && (
                <p className={styles.messageListStatus}>Aún no hay mensajes. Escribe el primero.</p>
            )}

            {messages.map((message) => {
                const day = new Date(message.sent_at).toDateString();
                const showDay = day !== lastDay;
                lastDay = day;

                return (
                    <div key={message.messageId}>
                        {showDay && <div className={styles.messageListDay}>{formatDayLabel(message.sent_at)}</div>}
                        <MessageBubble
                            message={message}
                            isOwn={Number(message.senderId) === myId}
                            contact={contact}
                            onDelete={onDelete}
                        />
                    </div>
                );
            })}

            <div ref={endRef} />
        </div>
    );
}
