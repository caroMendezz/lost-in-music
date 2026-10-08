import { useEffect, useRef } from "react";
import Avatar from "./Avatar";
import MessageBubble from "./MessageBubble";
import { formatDayLabel, formatTime } from "./formatters";
import styles from "./MessageList.module.css";

const TIME_GAP_MS = 30 * 60 * 1000; // separador con hora si pasan 30 min entre mensajes

export default function MessageList({ messages, contact, myId, loading, onRequestRevoke, onRequestDeleteForMe }) {
    const endRef = useRef(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ block: "end" });
    }, [messages]);

    // "Enviado" / "Visto" solo debajo del ultimo mensaje enviado por el usuario actual
    let lastOwnId = null;
    for (let i = messages.length - 1; i >= 0; i -= 1) {
        if (Number(messages[i].senderId) === myId) {
            lastOwnId = messages[i].messageId;
            break;
        }
    }

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

            {messages.map((message, index) => {
                const date = new Date(message.sent_at);
                const previous = messages[index - 1];
                const previousDate = previous ? new Date(previous.sent_at) : null;

                const newDay = !previousDate || previousDate.toDateString() !== date.toDateString();
                const longGap = previousDate && date - previousDate > TIME_GAP_MS;

                return (
                    <div key={message.messageId}>
                        {(newDay || longGap) && (
                            <div className={styles.messageListDay}>
                                {newDay ? `${formatDayLabel(date)}, ${formatTime(date)}` : formatTime(date)}
                            </div>
                        )}

                        <MessageBubble
                            message={message}
                            isOwn={Number(message.senderId) === myId}
                            contact={contact}
                            onRequestRevoke={onRequestRevoke}
                            onRequestDeleteForMe={onRequestDeleteForMe}
                        />

                        {message.messageId === lastOwnId && !message.deletedForAll && (
                            <div className={styles.messageListReceipt}>{message.is_read ? "Visto" : "Enviado"}</div>
                        )}
                    </div>
                );
            })}

            <div ref={endRef} />
        </div>
    );
}
